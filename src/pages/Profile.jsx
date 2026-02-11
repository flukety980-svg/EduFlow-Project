import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({
        full_name: '',
        avatar_url: '',
        role: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }

            setUser(user);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Error loading profile:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);

            let finalAvatarUrl = profile.avatar_url;

            // Handle File Upload if exists
            if (profile._avatarMode === 'file' && profile._avatarFile) {
                const file = profile._avatarFile;
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                finalAvatarUrl = publicUrl;
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    avatar_url: finalAvatarUrl,
                    updated_at: new Date(),
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state to reflect the new URL and clear file
            setProfile(prev => ({ ...prev, avatar_url: finalAvatarUrl, _avatarFile: null }));
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">กำลังโหลด...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">ข้อมูลส่วนตัว</h2>

            <form onSubmit={updateProfile} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                    <input
                        type="text"
                        value={user?.email}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 cursor-not-allowed text-gray-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">บทบาท (Role)</label>
                    <input
                        type="text"
                        value={profile.role === 'creator' ? 'ผู้สร้างเนื้อหา (Content Creator)' : 'ผู้เรียน (Learner)'}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 cursor-not-allowed text-gray-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                    <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รูปโปรไฟล์</label>
                    <div className="flex flex-col items-center gap-6 p-4 border rounded-lg bg-gray-50">
                        {/* Image Preview */}
                        <div className="relative">
                            <img
                                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=random&size=128`}
                                alt="Profile Preview"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=random&size=128`;
                                }}
                                className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                            />
                        </div>

                        {/* Input Type Selection */}
                        <div className="w-full">
                            <div className="flex gap-4 mb-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => setProfile({ ...profile, _avatarMode: 'url' })}
                                    className={`px-3 py-1 text-xs rounded border ${profile._avatarMode !== 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    🔗 ใช้ลิงก์
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProfile({ ...profile, _avatarMode: 'file' })}
                                    className={`px-3 py-1 text-xs rounded border ${profile._avatarMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    📸 อัปโหลดรูป
                                </button>
                            </div>

                            {profile._avatarMode === 'file' ? (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setProfile({ ...profile, _avatarFile: file }); // Store file temporarily

                                        // Optional: Preview local file
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            // This is just a preview, actual upload happens on save
                                            document.querySelector('img[alt="Profile Preview"]').src = reader.result;
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">ลิงก์รูปภาพ (URL)</label>
                                    <input
                                        type="url"
                                        value={profile.avatar_url || ''}
                                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                        placeholder="https://example.com/your-image.jpg"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 text-center">
                                        คำแนะนำ: คัดลอกลิงก์รูปภาพจากเว็บ (คลิกขวาที่รูป > Copy Image Address) มาวางที่นี่
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={updating}
                        className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {updating ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                </div>
            </form>

            {/* My Content Section */}
            {profile.role === 'creator' && (
                <div className="mt-12 border-t pt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">สื่อการเรียนรู้ของฉัน</h3>
                    <MyContentList user={user} />
                </div>
            )}
        </div>
    );
}

function MyContentList({ user }) {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyContents();
    }, []);

    const fetchMyContents = async () => {
        try {
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setContents(data || []);
        } catch (error) {
            console.error('Error fetching my contents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('คุณต้องการลบสื่อนี้ใช่หรือไม่?')) return;
        try {
            const { error } = await supabase.from('contents').delete().eq('id', id);
            if (error) throw error;
            setContents(contents.filter(c => c.id !== id));
        } catch (error) {
            alert('ลบไม่สำเร็จ: ' + error.message);
        }
    };

    if (loading) return <div>กำลังโหลด...</div>;

    return (
        <div className="space-y-4">
            {contents.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.status} • {new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.href = `/edit-content/${item.id}`} // Using location.href or navigate from props. But wait, navigate is cleaner.
                        // Better yet, let's use Link or pass navigate. 
                        // Actually, I can use Link from react-router-dom or just window.location since I am lazy to modify imports.
                        // Let's modify imports to include Link.
                        >
                            <a href={`/edit-content/${item.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                แก้ไข
                            </a>
                        </button>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            ลบ
                        </button>
                    </div>
                </div>
            ))}
            {contents.length === 0 && <p className="text-gray-500 text-center">ยังไม่มีเนื้อหา</p>}
        </div>
    );
}
