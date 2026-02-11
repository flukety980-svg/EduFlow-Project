import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { BookOpen, LogOut, Upload, Menu, X, User } from 'lucide-react';

export default function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // Check initial session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
        };
        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Exception fetching profile:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <span className="font-bold text-xl text-gray-900">EduFlow</span>
                        </Link>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-6">
                        <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                            หน้าแรก
                        </Link>

                        {user ? (
                            <>
                                <Link to="/upload" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium flex items-center gap-1">
                                    <Upload className="w-4 h-4" /> สร้างเนื้อหา
                                </Link>

                                <Link to="/profile" className="group flex flex-col items-center justify-center p-1 rounded-md hover:bg-gray-50 transition-colors">
                                    <div className="relative">
                                        <img
                                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=random`}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full border border-gray-200 object-cover group-hover:border-blue-400 transition-colors"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=random`;
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-600 group-hover:text-blue-600 max-w-[80px] truncate leading-none mt-1">
                                        {profile?.full_name || 'My Profile'}
                                    </span>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md font-medium flex items-center gap-1 text-sm transition-colors ml-2"
                                >
                                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                                    เข้าสู่ระบบ
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                    ลงทะเบียน
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                            หน้าแรก
                        </Link>
                        {user ? (
                            <>
                                <Link to="/upload" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                                    สร้างเนื้อหา
                                </Link>
                                <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                                    <img
                                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=random`}
                                        className="w-8 h-8 rounded-full border border-gray-200"
                                    />
                                    <span>โปรไฟล์ ({profile?.full_name})</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    ออกจากระบบ
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                                    เข้าสู่ระบบ
                                </Link>
                                <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">
                                    ลงทะเบียน
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
