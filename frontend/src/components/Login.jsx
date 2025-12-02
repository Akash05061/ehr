import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.success) navigate("/dashboard");

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>EHR System Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required 
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required 
              disabled={loading}
            />
          </div>

          <button className="auth-button" disabled={loading} type="submit">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p>Don't have an account? <Link to="/register">Register</Link></p>

      </div>
    </div>
  );
};

export default Login;
