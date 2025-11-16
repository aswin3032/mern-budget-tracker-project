import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- FORM VALIDATION LOGIC ---
  const validate = () => {
    const newErrors = {};
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error on change
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return; // Stop submission if validation fails
    }
    const loadingToast = toast.loading('Please wait...');
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await axios.post('/auth/register', form);
        await login(form.email, form.password); // Auto-login after register
      }
      toast.dismiss(loadingToast);
      toast.success(isLogin ? 'Logged in successfully!' : 'Account created!');
      navigate('/');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.msg || 'An error occurred.');
    }
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* --- Branding Section --- */}
      <motion.div 
        className="hidden md:flex flex-col justify-center items-center bg-primary text-white p-12"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold">BudgetApp</h1>
        <p className="mt-4 text-center text-lg opacity-80">
          Take control of your finances with smart, simple budgeting.
        </p>
      </motion.div>

      {/* --- Form Section --- */}
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <motion.div 
          className="w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold text-center mb-1 text-gray-800">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-center text-gray-500 mb-8">
              {isLogin ? 'Sign in to continue' : 'Get started in seconds'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div>
                <label className="input-label" htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} className="input-field" placeholder="••••••" />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <motion.button 
                type="submit" 
                className="btn-primary w-full py-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </motion.button>
            </form>
            <p className="text-center mt-6 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-primary font-medium hover:underline">
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}