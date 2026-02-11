import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
    const [thumbnailMode, setThumbnailMode] = useState('url'); // 'url' or 'file'

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'video',
        category: '',
        tags: [],
        file_url: '',
        thumbnail_url: ''
    });

    // File objects
    const [file, setFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);

    useEffect(() => {
        checkCreatorRole();
    }, []);

    const checkCreatorRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'creator') {
            alert('เฉพาะผู้สร้างเนื้อหา (Content Creator) เท่านั้นที่สามารถอัปโหลดได้');
            navigate('/');
        }
    };

    const handleFileUpload = async (fileObj, bucket) => {
        if (!fileObj) return null;

        const fileExt = fileObj.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileObj);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            let finalFileUrl = formData.file_url;
            let finalThumbnailUrl = formData.thumbnail_url;

            // Upload Main File if mode is 'file'
            if (uploadMode === 'file' && file) {
                finalFileUrl = await handleFileUpload(file, 'content_files');
            } else if (uploadMode === 'file' && !file) {
                // If checking for file REQUIRED
                // throw new Error('กรุณาเลือกไฟล์เนื้อหาที่ต้องการอัปโหลด');
            }

            // Upload Thumbnail if mode is 'file'
            if (thumbnailMode === 'file' && thumbnailFile) {
                finalThumbnailUrl = await handleFileUpload(thumbnailFile, 'thumbnails');
            }

            // Validate inputs
            // if (!finalFileUrl) throw new Error('กรุณาระบุลิงก์ไฟล์หรืออัปโหลดไฟล์');
            // if (formData.type !== 'article' && !finalFileUrl) throw new Error('กรุณาระบุไฟล์เนื้อหา');

            const { error } = await supabase.from('contents').insert([
                {
                    creator_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    type: formData.type,
                    category: formData.category,
                    tags: formData.tags,
                    file_url: finalFileUrl,
                    thumbnail_url: finalThumbnailUrl,
                    status: 'published'
                }
            ]);

            if (error) throw error;

            alert('สร้างเนื้อหาเรียบร้อยแล้ว!');
            navigate('/');
        } catch (error) {
            console.error('Upload Error:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">สร้างสื่อการเรียนรู้ใหม่</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อเรื่อง</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ประเภทสื่อ</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                        >
                            <option value="video">วิดีโอ (Video)</option>
                            <option value="pdf">เอกสาร (PDF)</option>
                            <option value="article">บทความ (Article)</option>
                            <option value="audio">เสียง (Audio)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                        >
                            <option value="">-- เลือกหมวดหมู่ --</option>
                            <option value="Programming">เขียนโปรแกรม (Programming)</option>
                            <option value="Design">ดีไซน์ (Design)</option>
                            <option value="Business">ธุรกิจ (Business)</option>
                            <option value="Language">ภาษา (Language)</option>
                            <option value="Mathematics">คณิตศาสตร์ (Math)</option>
                            <option value="Science">วิทยาศาสตร์ (Science)</option>
                            <option value="Lifestyle">ไลฟ์สไตล์ (Lifestyle)</option>
                            <option value="Other">อื่นๆ (Other)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (เลือกได้หลายข้อ)</label>
                    <div className="mt-1 flex gap-2 flex-wrap mb-2">
                        {formData.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newTags = formData.tags.filter((_, i) => i !== index);
                                        setFormData({ ...formData, tags: newTags });
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <select
                        value=""
                        onChange={(e) => {
                            if (e.target.value && !formData.tags.includes(e.target.value)) {
                                setFormData({ ...formData, tags: [...formData.tags, e.target.value] });
                            }
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    >
                        <option value="">-- เพิ่ม Tags --</option>
                        <option value="Beginner">ผู้เริ่มต้น (Beginner)</option>
                        <option value="Intermediate">ระดับกลาง (Intermediate)</option>
                        <option value="Advanced">ระดับสูง (Advanced)</option>
                        <option value="Theory">ทฤษฎี (Theory)</option>
                        <option value="Workshop">ปฏิบัติ/เวิร์กชอป (Workshop)</option>
                        <option value="Tutorial">สอนทำ (Tutorial)</option>
                        <option value="Case Study">กรณีศึกษา (Case Study)</option>
                        <option value="Free">ฟรี (Free)</option>
                        <option value="Premium">พรีเมียม (Premium)</option>
                    </select>
                </div>

                {/* Main Content Upload/Link */}
                <div className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-3">ไฟล์เนื้อหา (Main Content)</label>

                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setUploadMode('url')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${uploadMode === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            🔗 ใช้ลิงก์ (URL)
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode('file')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${uploadMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            📁 อัปโหลดไฟล์
                        </button>
                    </div>

                    {uploadMode === 'url' ? (
                        <input
                            type="url"
                            placeholder={formData.type === 'video' ? "https://youtube.com/..." : "https://example.com/file.pdf"}
                            value={formData.file_url}
                            onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                        />
                    ) : (
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            accept={formData.type === 'video' ? "video/*" : formData.type === 'image' ? "image/*" : formData.type === 'audio' ? "audio/*" : ".pdf"}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    )}
                </div>

                {/* Thumbnail Upload/Link */}
                <div className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-3">รูปปก (Thumbnail)</label>

                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setThumbnailMode('url')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${thumbnailMode === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            🔗 ใช้ลิงก์ (URL)
                        </button>
                        <button
                            type="button"
                            onClick={() => setThumbnailMode('file')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${thumbnailMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            🖼️ อัปโหลดรูป
                        </button>
                    </div>

                    {thumbnailMode === 'url' ? (
                        <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={formData.thumbnail_url}
                            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                        />
                    ) : (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnailFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    )}
                </div>

                <div className="pt-4 flex gap-4">
                    <button
                        type="button"
                        className="flex-1 justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                        onClick={() => {
                            if (window.confirm('คุณต้องการยกเลิกการสร้างเนื้อหาใช่หรือไม่? ข้อมูลที่กรอกจะหายไป')) {
                                navigate('/');
                            }
                        }}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'กำลังอัปโหลดและเผยแพร่...' : 'เผยแพร่เนื้อหา'}
                    </button>
                </div>
            </form>
        </div>
    );
}
