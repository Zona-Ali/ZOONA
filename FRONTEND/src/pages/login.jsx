import React from 'react'
import { useState } from 'react'
import "../App.css"
import axios from "axios";
import { toast } from "react-toastify";
import servers from "../environment";

function LoginPage({ onClose, onLogin }) {

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${servers}/api/v1/users/login`,
        formData
      );
      onLogin(res.data.user.username)
      onClose()
      toast.success("Login Successful!");

    } catch (err) {

      toast.error(err.response.data.message);
    }
  };



  return (

    <div className="overlay">
      <div className="loginBox">

        <button
          className="closeBtn"
          onClick={onClose}
        >
          ✕
        </button>

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />

          <button type="submit">
            Login
          </button>

        </form>




      </div>
    </div>
  )

}

export default LoginPage