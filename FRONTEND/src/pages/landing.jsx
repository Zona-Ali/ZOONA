import React from 'react'
import { useState } from 'react'
import "../App.css"
import LoginPage from './login';
import RegisterPage from './register';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? (storedUser) : null;
  });
  let routeTo = useNavigate();

  return (
    <div className='landingPageContainer'>
      <nav className='landingPageNav'>
        <div className='zoona-logo float'><img src="/zoona.png" alt="Zoona Logo" /></div>
        <div className='register'>
          {
            !user && <>
              <a href={`/${uuidv4()}`}>Join as Guest</a>
              <button className='btn' onClick={() => setShowRegister(true)}>Register </button>
              <button className='btn' onClick={() => setShowLogin(true)}>Login </button></>
          }
          {
            user && <button className='btn' onClick={() => { localStorage.removeItem("user"); setUser(""); toast.success("Logout Successful!"); }}>Logout </button>
          }
        </div>
      </nav>
      <div className='landingPageContent'>



        <div className='text-content'>
          <h1>Meet. Chat.
            <br />Have fun!</h1>
          <p>Zoona is a platform that allows you to
            connect with your loved ones.
            Join instantly and enjoy smooth,
            secure video conversations with people
            around the world.
            <br /> <br />
            <button className='btn' onClick={() => { localStorage.getItem("user") ? routeTo("/home") : routeTo("/"); toast.success("Register to get started !!!"); }} >Get Started</button>
          </p>

        </div>
        <div className='image-content'>
          <img src="/img.jpeg" alt="landing page image" />
        </div>

      </div>

      {showLogin && (<LoginPage onClose={() => setShowLogin(false)} onLogin={(user) => {
        localStorage.setItem("user", (user)
        )
        setUser(user)
        routeTo("/home")
      }} />)}
      {showRegister && (<RegisterPage onClose={() => setShowRegister(false)} onLogin={(user) => {
        localStorage.setItem("user", (user)
        )
        setUser(user)
        routeTo("/home")
      }}


      />)}
    </div>



  )
}
export default LandingPage