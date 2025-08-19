import React, { useState } from 'react';

export const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        // Validate form data
        if (!formData.name || !formData.email || !formData.phone || !formData.message) {
            setSubmitStatus('error');
            setIsSubmitting(false);
            return;
        }

        try {
            // Create email body content with proper line breaks for mailto
            const emailBody = `New Contact Form Submission:%0D%0A%0D%0AName: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0APhone: ${formData.phone}%0D%0A%0D%0AMessage:%0D%0A${formData.message}%0D%0A%0D%0A---%0D%0ASent from Pets Gallery Dubai Contact Form`;

            // Create mailto link
            const subject = encodeURIComponent('New Contact Form Submission - Pets Gallery Dubai');
            const mailtoLink = `mailto:petsgallery033@gmail.com?subject=${subject}&body=${emailBody}`;

            // Open email client
            window.open(mailtoLink, '_self');

            // Set success status
            setTimeout(() => {
                setSubmitStatus('success');
                
                // Reset form on success
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    message: ''
                });
                setIsSubmitting(false);
            }, 1000);

        } catch (error) {
            console.log('Error:', error);
            setSubmitStatus('error');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-20">
            <div className="max-w-8xl w-full flex flex-col lg:flex-row gap-6">
                {/* Left Section - Text */}
                <div className="lg:w-2/5 bg-white p-8 rounded-xl shadow-lg flex flex-col h-auto lg:h-[500px] mb-6 lg:mb-0">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold leading-[1.4]">
                            <div className="relative inline-block">
                                <span className="text-2xl mr-2">🐕</span>
                                We're Just A
                            </div>
                            <div>
                                <span className="text-orange-400 mr-2">Bark</span> 
                                <span className="relative inline-block">
                                    Or
                                    <span className="absolute top-1/2 left-1/2 w-4 h-4 transform -translate-x-1/2 -translate-y-1/2">🐾</span>
                                </span>
                                <span className="mx-4 text-2xl">🐱</span>
                                <span className="text-orange-400"> Meow</span> Away!<br />
                                Contact Us Today!
                            </div>
                        </h1>
                    </div>
                    <p className="text-gray-600 mt-4 lg:mt-auto">
                    !

🐶 Bark, 🐱 Meow… We're Only a Message Away!
Your Furry Friends Are a 🐾 Away — Contact Us Today!
                    </p>
                </div>

                {/* Middle Section - Contact Form */}
                <div className="lg:w-2/5 bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg mb-6 lg:mb-0">
                    <div className="flex flex-col h-full min-h-[400px] lg:min-h-[550px]">
                        <h2 className="text-lg font-semibold mb-4">Contact Form</h2>
                        
                        {/* Status Messages */}
                        {submitStatus === 'success' && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                                Thank you! Your email client should open with the message ready to send.
                            </div>
                        )}
                        {submitStatus === 'error' && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                Please fill in all fields or try again.
                            </div>
                        )}

                        <div className="flex flex-col flex-1 space-y-4">
                            <input 
                                type="text" 
                                name="name"
                                placeholder="Name" 
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-500 rounded-2xl placeholder-gray-500" 
                                required
                            />
                            <input 
                                type="email" 
                                name="email"
                                placeholder="Email" 
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-500 rounded-2xl placeholder-gray-500" 
                                required
                            />
                            <input 
                                type="tel" 
                                name="phone"
                                placeholder="Phone" 
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-500 rounded-2xl placeholder-gray-500" 
                                required
                            />
                            <textarea 
                                name="message"
                                placeholder="Message" 
                                value={formData.message}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-500 rounded-2xl placeholder-gray-500 flex-1 min-h-[120px] resize-none"
                                required
                            ></textarea>
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`w-full py-3 rounded-full transition-colors font-semibold ${
                                    isSubmitting 
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                            >
                                {isSubmitting ? 'Opening Email...' : 'Contact Now'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Section - Contact Cards */}
                <div className="lg:w-1/5 flex flex-col gap-4 h-auto lg:h-[500px]">
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center h-auto lg:h-1/3 mb-4 lg:mb-0">
                        <span className="text-2xl">📞</span>
                        <h3 className="font-semibold mt-2">Phone</h3>
                        <p className="text-gray-600">+971 56 418 0500</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center h-auto lg:h-1/3 mb-4 lg:mb-0">
                        <span className="text-2xl">✉️</span>
                        <h3 className="font-semibold mt-2">Email</h3>
                        <p className="text-gray-600">petsgallery033@gmail.com</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center h-auto lg:h-1/3">
                        <span className="text-2xl">📍</span>
                        <h3 className="font-semibold mt-2">Address</h3>
                        <p className="text-gray-600">Al wasl sports club stadium building shop #33
Nouras street 
Al Jaddaf Dubai</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;