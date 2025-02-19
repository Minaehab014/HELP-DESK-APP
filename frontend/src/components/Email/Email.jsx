import React, { useState } from 'react';
import Cookies from 'js-cookie';
import'./Email.css';
import NavbarAgent from "../../pages/NavbarAgent.jsx";
const EmailForm = () => {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    // const handleSubmit = async (e) => {
    //     let data = {
    //         to: email,
    //         subject: subject,
    //         text: message
    //     }
    //
    //     e.preventDefault();
    //     try {
    //         const response = await axios.post('http://localhost:5000/api/v1/sendEmail', data, {
    //         });
    //         console.log(response.data);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
            console.log("email: " + email);
            console.log("subject: " + subject);
            console.log("message: " + message);
      await  fetch('https://localhost:5000/api/v1/sendEmail', {
            withCredentials: true,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                to: email,
                subject,
                text: message
            })
        })
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                console.log(data);
                alert("Email Sent");
                setEmail('');
                setSubject('');
                setMessage('');
            })
            .catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        }


    return (

        <form onSubmit={handleSubmit}>
             <NavbarAgent/>
            <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
                Subject:
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </label>
            <label>
                Message:
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
            </label>
            <button type="submit" >Send Email</button>
        </form>
    );
};

export default EmailForm;
