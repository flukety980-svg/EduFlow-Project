import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Calendar, MessageSquare, Send, ThumbsUp, ThumbsDown, CornerDownRight } from 'lucide-react';

export default function ContentDetail() {
    const { id } = useParams();
    const [content, setContent] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Vote State
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userVote, setUserVote] = useState(null); // 'like', 'dislike', or null
    const [views, setViews] = useState(0);

    useEffect(() => {
        fetchContent();
        fetchComments();
        checkUser();
        fetchVotes();
        fetchViews();
    }, [id]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
    };

    const fetchViews = async () => {
        try {
            const { count, error } = await supabase
                .from('access_logs')
                .select('*', { count: 'exact', head: true })
                .eq('content_id', id);

            if (error) throw error;
            setViews(count || 0);
        } catch (error) {
            console.error('Error fetching views:', error);
        }
    };

    const fetchVotes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('content_votes')
                .select('*')
                .eq('content_id', id);

            if (error) throw error;

            const likeCount = data.filter(v => v.vote_type === 'like').length;
            const dislikeCount = data.filter(v => v.vote_type === 'dislike').length;

            setLikes(likeCount);
            setDislikes(dislikeCount);

            if (user) {
                const myVote = data.find(v => v.user_id === user.id);
                setUserVote(myVote ? myVote.vote_type : null);
            }
        } catch (error) {
            console.error('Error fetching votes:', error);
        }
    };

    const handleVote = async (type) => { // type: 'like' or 'dislike'
        if (!user) {
            alert('กรุณาเข้าสู่ระบบเพื่อโหวต');
            return;
        }

        const previousVote = userVote;
        let newVote = type;

        // If clicking same vote, toggle off (remove vote)
        if (previousVote === type) {
            newVote = null;
        }

        // Optimistic UI Update
        setUserVote(newVote);
        if (newVote === 'like') {
            setLikes(prev => prev + 1);
            if (previousVote === 'dislike') setDislikes(prev => prev - 1);
        } else if (newVote === 'dislike') {
            setDislikes(prev => prev + 1);
            if (previousVote === 'like') setLikes(prev => prev - 1);
        } else {
            // Removing vote
            if (previousVote === 'like') setLikes(prev => prev - 1);
            if (previousVote === 'dislike') setDislikes(prev => prev - 1);
        }

        try {
            if (newVote) {
                // Upsert (Insert or Update)
                const { error } = await supabase
                    .from('content_votes')
                    .upsert({
                        user_id: user.id,
                        content_id: id,
                        vote_type: newVote
                    }, { onConflict: 'user_id, content_id' });

                if (error) throw error;
            } else {
                // Delete
                const { error } = await supabase
                    .from('content_votes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('content_id', id);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Error voting:', error);
            // Revert UI on error (simplified, ideally better state management)
            alert('เกิดข้อผิดพลาดในการโหวต: ' + error.message || 'Unknown error');
            fetchVotes(); // Re-fetch to sync
        }
    };

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase
                .from('contents')
                .select(`
          *,
          profiles (full_name, avatar_url)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setContent(data);

            // Log access history if user is logged in
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase.from('access_logs').insert({
                    user_id: session.user.id,
                    content_id: id
                });
                // Increment local view count immediately for better UX
                setViews(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase
                .from('comments')
                .select(`
                    *,
                    profiles (full_name, avatar_url),
                    comment_likes (user_id)
                `)
                .eq('content_id', id)
                .order('created_at', { ascending: true }); // Order by oldest first for readable thread

            const { data, error } = await query;
            if (error) throw error;

            // Process comments to add like count and isLiked status
            const processedComments = data.map(comment => ({
                ...comment,
                like_count: comment.comment_likes.length,
                is_liked: user ? comment.comment_likes.some(like => like.user_id === user.id) : false,
                replies: [] // Initialize replies array
            }));

            // Structure comments into a tree (nested replies)
            const commentMap = {};
            const rootComments = [];

            processedComments.forEach(comment => {
                commentMap[comment.id] = comment;
            });

            processedComments.forEach(comment => {
                if (comment.parent_id) {
                    if (commentMap[comment.parent_id]) {
                        commentMap[comment.parent_id].replies.push(comment);
                    }
                } else {
                    rootComments.push(comment);
                }
            });

            setComments(rootComments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleCommentSubmit = () => {
        fetchComments();
    };

    if (loading) return <div className="text-center py-12">กำลังโหลด...</div>;
    if (!content) return <div className="text-center py-12">ไม่พบเนื้อหา</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Content Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>

                    {/* Like/Dislike Buttons */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                        <button
                            onClick={() => handleVote('like')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors ${userVote === 'like' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'}`}
                        >
                            <ThumbsUp className={`w-5 h-5 ${userVote === 'like' ? 'fill-current' : ''}`} />
                            <span className="font-semibold">{likes}</span>
                        </button>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <button
                            onClick={() => handleVote('dislike')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors ${userVote === 'dislike' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-200 text-gray-700'}`}
                        >
                            <ThumbsDown className={`w-5 h-5 ${userVote === 'dislike' ? 'fill-current' : ''}`} />
                            <span className="font-semibold">{dislikes > 0 ? dislikes : 'ไม่ชอบ'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 border-b pb-6">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{content.profiles?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{views} การรับชม</span>
                        <span>•</span>
                        <span>{new Date(content.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold ml-auto">
                        {content.category}
                    </span>
                </div>

                {/* Content Viewer */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 flex items-center justify-center relative">
                    {content.type === 'video' ? (
                        (() => {
                            const getEmbedUrl = (url) => {
                                if (!url) return null;
                                const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^#&?]*)/);
                                if (ytMatch && ytMatch[1]) {
                                    return `https://www.youtube.com/embed/${ytMatch[1]}`;
                                }
                                return null;
                            };
                            const embedUrl = getEmbedUrl(content.file_url);

                            if (embedUrl) {
                                return (
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full"
                                        title="Video Player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                );
                            } else {
                                return (
                                    <video controls className="w-full h-full" src={content.file_url} poster={content.thumbnail_url}>
                                        Your browser does not support the video tag.
                                    </video>
                                );
                            }
                        })()
                    ) : content.type === 'pdf' ? (
                        <iframe src={content.file_url} className="w-full h-full" title="PDF Viewer"></iframe>
                    ) : content.type === 'audio' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-6">
                            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                                <span className="text-4xl">🎵</span>
                            </div>
                            <audio controls className="w-full max-w-md" src={content.file_url}>
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ) : (
                        <img
                            src={content.thumbnail_url || content.file_url}
                            alt="Content"
                            className="h-full w-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/800x450?text=No+Image';
                            }}
                        />
                    )}
                </div>
                {content.type !== 'video' && (
                    <div className="flex justify-center mb-6">
                        <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 items-center flex gap-2">
                            <span>เปิดดูเนื้อหาฉบับเต็ม</span>
                        </a>
                    </div>
                )}

                <div className="prose max-w-none text-gray-700 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">คำอธิบาย</h3>
                    <p>{content.description || 'ไม่มีคำอธิบาย'}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    {content.tags?.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    ความคิดเห็น
                </h3>

                {/* Root Comment Form */}
                <CommentForm contentId={id} parentId={null} onCommentSubmit={handleCommentSubmit} user={user} />

                {/* Comment List */}
                <div className="space-y-6 mt-8">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} contentId={id} onCommentSubmit={handleCommentSubmit} user={user} />
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-gray-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นเลย!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CommentItem({ comment, contentId, onCommentSubmit, user }) {
    const [isReplying, setIsReplying] = useState(false);
    const [isLiked, setIsLiked] = useState(comment.is_liked);
    const [likeCount, setLikeCount] = useState(comment.like_count);

    const handleLike = async () => {
        if (!user) {
            alert('กรุณาเข้าสู่ระบบก่อนกดถูกใจ');
            return;
        }

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: comment.id });
            } else {
                await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', comment.id);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    return (
        <div className="flex gap-4">
            <img
                src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.profiles?.full_name || 'User')}`}
                alt={comment.profiles?.full_name}
                className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                            {comment.profiles?.full_name}
                        </span>
                        <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString('th-TH')}
                        </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.text}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2 ml-1">
                    <button
                        onClick={handleLike}
                        className={`text-xs font-semibold flex items-center gap-1 ${isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ThumbsUp className="w-3 h-3" /> {likeCount > 0 ? likeCount : 'ถูกใจ'}
                    </button>
                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                        ตอบกลับ
                    </button>
                </div>

                {/* Reply Form */}
                {isReplying && (
                    <div className="mt-3 ml-2">
                        <CommentForm
                            contentId={contentId}
                            parentId={comment.id}
                            onCommentSubmit={() => {
                                setIsReplying(false);
                                onCommentSubmit();
                            }}
                            user={user}
                            autoFocus
                        />
                    </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} contentId={contentId} onCommentSubmit={onCommentSubmit} user={user} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CommentForm({ contentId, parentId, onCommentSubmit, user, autoFocus }) {
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || !user) return;
        setSubmitting(true);

        try {
            const { error } = await supabase.from('comments').insert({
                content_id: contentId,
                parent_id: parentId,
                user_id: user.id,
                text: text
            });

            if (error) throw error;
            setText('');
            onCommentSubmit();
        } catch (error) {
            alert('Error posting comment: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        if (parentId) return null; // Don't show reply login prompt, user knows they need to login from main form
        return (
            <div className="bg-gray-50 p-4 rounded-lg text-center mb-8">
                <p className="text-gray-600">กรุณา <Link to="/login" className="text-blue-600 font-semibold">เข้าสู่ระบบ</Link> เพื่อแสดงความคิดเห็น</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-3">
            <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
            />
            <div className="flex-grow">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={parentId ? "เขียนคำตอบกลับ..." : "แสดงความคิดเห็น..."}
                    autoFocus={autoFocus}
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[60px] text-sm p-2"
                />
                <div className="mt-2 text-right">
                    <button
                        type="submit"
                        disabled={!text.trim() || submitting}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold inline-flex items-center gap-1"
                    >
                        <Send className="w-3 h-3" /> {submitting ? 'กำลังส่ง...' : 'ส่ง'}
                    </button>
                </div>
            </div>
        </form>
    );
}
