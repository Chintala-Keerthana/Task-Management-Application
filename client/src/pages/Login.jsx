import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api/axios";

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Read registration success messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // clear navigation state to prevent persistence on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Redirect if user is already logged in
  useEffect(() => {
    const token = safeGetItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", formData);
      safeSetItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow p-4 border-0 rounded-4" style={{ background: "var(--bg)" }}>
            <h2 className="text-center mb-4" style={{ color: "var(--text-h)", fontWeight: "600" }}>
              Welcome Back 👋
            </h2>

            {successMsg && (
              <div className="alert alert-success py-2 rounded-3 text-center" role="alert">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="alert alert-danger py-2 rounded-3 text-center" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label" style={{ color: "var(--text)", fontWeight: "500" }}>Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded-3"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4 text-start">
                <label className="form-label" style={{ color: "var(--text)", fontWeight: "500" }}>Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control rounded-3"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
          
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 rounded-3"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-center mt-4 mb-0" style={{ color: "var(--text)" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "600" }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;