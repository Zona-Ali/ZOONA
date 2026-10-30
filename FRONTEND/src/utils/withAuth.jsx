import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth= (WrappedComponent)=>{
    const AuthComponent =(props)=>{
        const routeTo = useNavigate();

        const isAuthenticated =()=>{
            if(localStorage.getItem("user")){
                return true;
            }
            return false;
        }
        useEffect(()=>{
            if(isAuthenticated()){
                routeTo("/home")
            }else{
                routeTo("/")
            }
        },[])

        return <WrappedComponent {...props}></WrappedComponent>
    }
    return AuthComponent;
}

export default withAuth;