import { useState } from "react";
import "./AboutUs2Contact.css";
import cloud from "../../../assets/cloud.png";
import facebook from "../../../assets/facebook_a.png";
import twitter from "../../../assets/twitter_a.png";
import linkedin from "../../../assets/linkedin_a.png";
import whatsapp from "../../../assets/whatsapp_a.png";

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
    <section className="aboutus2-contact-section">
      <h2 className="section-main-title">We'd Love to Hear From You</h2>
      
      <div className="contact-main-flex">
        <div className="contact-left-side">
          <div className="contact-form-card">
            <h3 className="contact-form-title">Leave your message</h3>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group-item">
                <label>Full name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Enter Your Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group-item">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter Your Email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group-item">
                <label>Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  placeholder="Enter your topic"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group-item">
                <label>Message</label>
                <textarea 
                  name="message" 
                  placeholder="Tell us what you need help with..."
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-checkbox-group">
                <input 
                  type="checkbox" 
                  id="agree" 
                  name="agreed"
                  checked={formData.agreed}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <label htmlFor="agree">I agree to the privacy policy</label>
              </div>
              
              <button type="submit" className="contact-submit-btn">Submit</button>
            </form>
          </div>
        </div>

        <div className="contact-right-side">
          <div className="clouds-container">
            <div className="floating-cloud cloud-large">
              <img src={cloud} alt="Cloud" />
              <div className="cloud-text">Don't hesitate to <br/> contact us</div>
            </div>
            
            <div className="clouds-bottom">
              <div className="floating-cloud cloud-small">
                <img src={cloud} alt="Cloud" />
                <div className="cloud-text">
                  <span className="info-label">Phone:</span><br/>
                  (+961) 71 444 900
                </div>
              </div>
              
              <div className="floating-cloud cloud-small">
                <img src={cloud} alt="Cloud" />
                <div className="cloud-text">
                  <span className="info-label">Email:</span><br/>
                  neurospark@gmail.com
                </div>
              </div>
            </div>
          </div>

          <div className="social-media-footer">
            <div className="social-content">
              <span className="social-label">Social Media:</span>
              <div className="social-icons">
                <img src={facebook} alt="Facebook" />
                <img src={twitter} alt="Twitter" />
                <img src={linkedin} alt="LinkedIn" />
                <img src={whatsapp} alt="WhatsApp" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs2Contact;
