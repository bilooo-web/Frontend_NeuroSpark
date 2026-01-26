import { useState } from "react";
import "./AboutUs2Contact.css";
import contactDecor from "../../../assets/Group contact.png";
import facebook from "../../../assets/facebook.png";
import twitter from "../../../assets/twitter.png";


import socialIcon from "../../../assets/social.png";
import cloud from "../../../assets/cloud.png";

const AboutUs2Contact = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
    agreed: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <section className="aboutus2-contact">
      <h2 className="contact2-title">We'd Love to Hear From You</h2>
      
      <div className="contact2-container">
        <div className="contact2-left-form">
          <div className="form-card">
            <h3>Leave your message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Enter Your Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter Your Email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  placeholder="Enter your topic"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  name="message" 
                  placeholder="Tell us what you need help with..."
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-check">
                <input 
                  type="checkbox" 
                  id="agree" 
                  name="agreed"
                  checked={formData.agreed}
                  onChange={handleChange}
                />
                <label htmlFor="agree">I agree to the privacy policy</label>
              </div>
              
              <button type="submit" className="form-btn">Submit</button>
            </form>
          </div>
        </div>

        <div className="contact2-right-decor">
          <div className="clouds-wrapper">
             <div className="cloud-contact cloud-c1">
               <img src={cloud} alt="Cloud" />
               <span>Don't hesitate to <br/> contact us</span>
             </div>

             <div className="cloud-contact cloud-c2">
               <img src={cloud} alt="Cloud" />
               <span>
                 <span className="cloud-label">Phone:</span><br/>
                 (+961) 71 444 900
               </span>
             </div>

             <div className="cloud-contact cloud-c3">
               <img src={cloud} alt="Cloud" />
               <span>
                 <span className="cloud-label">Email:</span><br/>
                 neurospark@gmail.com
               </span>
             </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default AboutUs2Contact;
