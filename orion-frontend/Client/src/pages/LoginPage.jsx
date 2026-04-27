
import { useState } from 'react';
import { User, Eye, EyeClosed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { loginUser } from '../services/UserService';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password || !formData.fullName) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        name: formData.fullName,
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/upload', { replace: true });
    } catch (err) {
      setError('Login failed. Please try again. Please check the email and password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar ButtonOneText={'Home'} ButtonOneRoute={'/'} ButtonTwoText={'Sign Up'} ButtonTwoRoute={'/signup'} />
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 py-10">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center bg-linear-to-tr from-indigo-500 to-violet-500 mb-4">
                  <User className="text-white" />
                </div>

                <h2 className="text-2xl font-semibold text-white">Welcome</h2>
                <p className="mt-2 text-sm text-slate-300">Enter your credentials to continue.</p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                {error && (
                  <div role="alert" aria-live="assertive" className="text-sm text-red-400 bg-red-900/30 p-2 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="fullName" className="sr-only">Full Name</label>
                  <div className="relative">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      placeholder="Full name"
                      className="w-full bg-transparent border border-white/10 rounded-lg py-3 pl-4 pr-3 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      aria-label="Full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="Email address"
                    className="w-full bg-transparent border border-white/10 rounded-lg py-3 px-4 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    aria-label="Email address"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Password"
                    className="w-full bg-transparent border border-white/10 rounded-lg py-3 px-4 pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-300 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeClosed /> : <Eye />}
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full inline-flex items-center justify-center rounded-2xl py-3 px-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/40 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Logging in…' : 'Login'}
                  </button>
                </div>

                <div className="text-sm text-center pb-5 text-slate-300">
                  <span>Don't have an account? </span>
                  <Link to={'/signup'} className="font-medium text-indigo-300 hover:text-indigo-100">Sign Up</Link>
                </div>
              </form>
            </div>
            <div className="bg-white/3 border-t border-white/6 px-8 py-4 text-center text-xs text-slate-400">
              By logging in you agree to our Terms & Privacy.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}