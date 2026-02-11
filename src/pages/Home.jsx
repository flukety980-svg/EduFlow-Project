import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Play, FileText, Music, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Changed from Link to useNavigate

export default function Home() {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState(null); // New state for user
    const navigate = useNavigate(); // New hook for navigation

    useEffect(() => {
        fetchContents();
        checkUser(); // Call checkUser on mount
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
    };

    const fetchContents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('contents')
                .select(`
          *,
          profiles (full_name, avatar_url)
        `)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContents(data || []);
        } catch (error) {
            console.error('Error fetching contents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (id) => {
        if (user) {
            navigate(`/content/${id}`);
        } else {
            if (window.confirm('คุณต้องเข้าสู่ระบบก่อนเพื่อเข้าชมเนื้อหา\nต้องการเข้าสู่ระบบหรือไม่?')) {
                navigate('/login');
            }
        }
    };

    const filteredContents = contents.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <Play className="w-5 h-5" />;
            case 'pdf': return <FileText className="w-5 h-5" />;
            case 'audio': return <Music className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                    แหล่งเรียนรู้ไร้ขีดจำกัด
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    ค้นพบ แบ่งปัน และเติบโตไปกับ EduFlow พื้นที่สำหรับทุกคนที่รักการเรียนรู้
                </p>

                <div className="max-w-xl mx-auto relative mt-8">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                        placeholder="ค้นหาบทเรียนที่สนใจ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">กำลังโหลดเนื้อหา...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                    {filteredContents.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleCardClick(item.id)}
                            className="cursor-pointer group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col h-full"
                        >
                            <div className="aspect-video w-full bg-gray-100 relative overflow-hidden">
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                    {getTypeIcon(item.type)}
                                    <span className="capitalize">{item.type}</span>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-grow">
                                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-2">
                                    <span className="bg-blue-50 px-2 py-1 rounded-full">{item.category}</span>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                                    {item.title}
                                </h3>

                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">
                                    {item.description}
                                </p>

                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                                    <img
                                        src={item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${item.profiles?.full_name}`}
                                        alt={item.profiles?.full_name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-xs text-gray-500 truncate">
                                        {item.profiles?.full_name}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                        {item.view_count || 0} การรับชม • {new Date(item.created_at).toLocaleDateString('th-TH')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredContents.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            ไม่พบเนื้อหาที่ค้นหา
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
