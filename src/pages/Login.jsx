import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let loginEmail = email.trim();

        try {
            // Check if input is NOT an email (simple check)
            const isEmail = loginEmail.includes('@');

            if (!isEmail) {
                // Try to find email from full_name in profiles table (case-insensitive)
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('email')
                    .ilike('full_name', loginEmail) // Case-insensitive match
                    .maybeSingle(); // Use maybeSingle to avoid error if 0 or multiple

                if (profileError) throw new Error('เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้');

                if (!data?.email) {
                    throw new Error('ไม่พบชื่อผู้ใช้งานนี้ในระบบ (กรุณาตรวจสอบชื่อหรือใช้อีเมลแทน)');
                }
                loginEmail = data.email;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage === 'Invalid login credentials') {
                errorMessage = 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง';
            } else if (errorMessage.includes('Email not confirmed')) {
                errorMessage = 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    เข้าสู่ระบบ EduFlow
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            อีเมล หรือ ชื่อ-นามสกุล
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="text"
                                autoComplete="username"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                รหัสผ่าน
                            </label>
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>
                        </div>
                        <div className="mt-2 relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm text-gray-500">
                    ยังไม่มีบัญชี?{' '}
                    <Link to="/register" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
                        ลงทะเบียนที่นี่
                    </Link>
                </p>
            </div>
        </div>
    );
}
