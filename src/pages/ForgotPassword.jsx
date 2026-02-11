import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Calling the custom RPC function created in Supabase
            const { data, error } = await supabase.rpc('reset_user_password', {
                target_identity: email.trim(), // Can be email or full_name
                new_password: newPassword
            });

            if (error) throw error;

            if (data === 'Success') {
                setMessage('เปลี่ยนรหัสผ่านสำเร็จแล้ว! คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที');
                // Optional: Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                throw new Error('ไม่พบอีเมลหรือชื่อผู้ใช้งานนี้ในระบบ');
            }
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes('function public.reset_user_password(text, text) does not exist')) {
                errorMessage = 'ระบบหลังบ้านยังไม่พร้อม (กรุณารันคำสั่ง SQL ใน Supabase ตามคู่มือครับ)';
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
                    ตั้งค่ารหัสผ่านใหม่ทันที
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    กรอกชื่อหรืออีเมล และกำหนดรหัสผ่านใหม่
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6" onSubmit={handleResetPassword}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            ชื่อ-นามสกุล หรือ อีเมล
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="อีเมล หรือ ชื่อ-นามสกุล"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium leading-6 text-gray-900">
                            กำหนดรหัสผ่านใหม่
                        </label>
                        <div className="mt-2 relative">
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-10"
                                placeholder="รหัสผ่านใหม่ 6 ตัวขึ้นไป"
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

                    {message && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่ทันที'}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm text-gray-500">
                    จำรหัสผ่านได้แล้ว?{' '}
                    <Link to="/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
                        กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </p>
            </div>
        </div>
    );
}
