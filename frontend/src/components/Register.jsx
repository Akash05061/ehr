import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!formData.email.includes("@"))
      e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: "staff",
    };

    const result = await register(payload);

    if (result.success) navigate("/dashboard");

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" name="firstName"
              placeholder="First Name" required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <input type="text" name="lastName"
              placeholder="Last Name" required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <input type="text" name="username"
            placeholder="Username" required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          <input type="email" name="email"
            placeholder="Email" required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <span className="error">{errors.email}</span>}

          <div className="form-row">
            <input type="password" name="password"
              placeholder="Password" required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <input type="password" name="confirmPassword"
              placeholder="Confirm Password" required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}

          <button className="auth-button" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default Register;
