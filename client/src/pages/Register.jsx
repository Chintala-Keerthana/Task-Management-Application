import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const res = await API.post("/auth/register", formData);
      navigate("/", { state: { message: res.data.message || "Registration Successful! Please log in." } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed. Please try again.");
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
              Create Account 🚀
            </h2>

            {error && (
              <div className="alert alert-danger py-2 rounded-3 text-center" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label" style={{ color: "var(--text)", fontWeight: "500" }}>Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control rounded-3"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 rounded-3"
                disabled={loading}
                // style={{
                //   background: "linear-gradient(135deg, var(--accent) 0%, #8b2ae0 100%)",
                //   border: "none",
                //   fontWeight: "600"
                // }}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            <p className="text-center mt-4 mb-0" style={{ color: "var(--text)" }}>
              Already have an account?{" "}
              <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "600" }}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
