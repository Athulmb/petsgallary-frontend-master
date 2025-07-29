import React, { useState } from 'react';

export const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: 'Grooming',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        // Enhanced token retrieval with better logging
        const authToken = localStorage.getItem('authToken');
        const token = localStorage.getItem('token');
        const finalToken = authToken || token;
        
        // Comprehensive logging
        console.log('=== CONTACT FORM SUBMISSION START ===');
        console.log('Form Data being sent:', {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            service: formData.service,
            message: formData.message
        });
        console.log('Token Status:');
        console.log('- authToken from localStorage:', authToken ? 'Found' : 'Not found');
        console.log('- token from localStorage:', token ? 'Found' : 'Not found');
        console.log('- Final token being used:', finalToken ? 'Token available' : 'No token available');
        console.log('- Token preview (first 20 chars):', finalToken ? finalToken.substring(0, 20) + '...' : 'N/A');

        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            // Add Authorization header if token exists
            if (finalToken) {
                headers['Authorization'] = `Bearer ${finalToken}`;
                console.log('✅ Authorization header added');
            } else {
                console.log('⚠️ No token found - proceeding without authorization');
            }

            console.log('Request Configuration:');
            console.log('- URL:', 'https://backend.petsgallerydubai.com/api/contact');
            console.log('- Method:', 'POST');
            console.log('- Headers:', headers);
            console.log('- Body:', JSON.stringify(formData, null, 2));

            const response = await fetch('https://backend.petsgallerydubai.com/api/bookings', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(formData)
            });

            console.log('=== API RESPONSE ===');
            console.log('Response Status:', response.status);
            console.log('Response Status Text:', response.statusText);
            console.log('Response OK:', response.ok);
            console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const responseData = await response.json();
                console.log('✅ SUCCESS - Response Data:', responseData);
                setSubmitStatus('success');
                
                // Reset form on success
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    service: 'Grooming',
                    message: ''
                });
                console.log('✅ Form reset successfully');
            } else {
                let errorData;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                    console.log('❌ ERROR - JSON Response:', errorData);
                } else {
                    errorData = await response.text();
                    console.log('❌ ERROR - Text Response:', errorData);
                }
                
                console.log('❌ API call failed with status:', response.status);
                setSubmitStatus('error');
            }
        } catch (error) {
            console.log('❌ NETWORK/FETCH ERROR:');
            console.log('Error name:', error.name);
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
            console.log('=== CONTACT FORM SUBMISSION END ===');
        }
    };

    // Demo function to test localStorage (for development)
    const handleTestLocalStorage = () => {
        console.log('=== LOCALSTORAGE TEST ===');
        console.log('All localStorage items:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value?.substring(0, 50) + (value?.length > 50 ? '...' : ''));
        }
        
        // Set a test token if none exists
        if (!localStorage.getItem('authToken') && !localStorage.getItem('token')) {
            localStorage.setItem('authToken', 'test-token-123456789');
            console.log('✅ Test token added to localStorage');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-20">
            {/* Test button for development */}
            <div className="max-w-8xl w-full mb-4">
                <button 
                    onClick={handleTestLocalStorage}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                    Test localStorage (Check Console)
                </button>
            </div>

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
                        Lorem ipsum dolor sit amet consectetur. Urna luctus amet habitant sit ac.
                        Risus consectetur sit etiam pellentesque turpis ornare.
                    </p>
                </div>

                {/* Middle Section - Contact Form */}
                <div className="lg:w-2/5 bg-white p-8 rounded-xl shadow-lg h-auto lg:h-[500px] mb-6 lg:mb-0">
                    <h2 className="text-lg font-semibold">Contact Form</h2>
                    
                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                        <div className="mt-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                            Thank you! Your message has been sent successfully.
                        </div>
                    )}
                    {submitStatus === 'error' && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            Sorry, there was an error sending your message. Please try again.
                        </div>
                    )}

                    <div className="mt-4 space-y-4 flex flex-col h-auto lg:h-[90%]">
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
                        <select 
                            name="service"
                            value={formData.service}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-500 rounded-2xl text-gray-700"
                            required
                        >
                            <option value="Grooming">Grooming</option>
                            <option value="Adoption">Adoption</option>
                            <option value="Pets Passport">Pets Passport</option>
                            <option value="Foods">Foods</option>
                        </select>
                        <textarea 
                            name="message"
                            placeholder="Message" 
                            value={formData.message}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-500 rounded-2xl placeholder-gray-500 min-h-32 lg:flex-grow"
                            required
                        ></textarea>
                        <button 
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full py-3 rounded-full transition-colors font-semibold ${
                                isSubmitting 
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                    : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                        >
                            {isSubmitting ? 'Sending...' : 'Book Now'}
                        </button>
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
                        <p className="text-gray-600">Al Jaddaf - Dubai - United Arab Emirates</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;