import React, { useState } from 'react';

export const BookingPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: 'Dog',
        groomingType: '',
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

        // Combine grooming type with message for backend
        let combinedMessage = '';
        if (formData.groomingType) {
            combinedMessage = `Grooming Package: ${formData.groomingType}`;
            if (formData.message.trim()) {
                combinedMessage += `  Notes: ${formData.message.trim()}`;
            }
        } else if (formData.message.trim()) {
            combinedMessage = formData.message.trim();
        }

        const apiData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            service: formData.service,
            message: combinedMessage // Combined grooming type and message
        };

       
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

            const response = await fetch('https://backend.petsgallerydubai.com/api/bookings', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(apiData)
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
                    service: 'Dog',
                    groomingType: '',
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
            console.log('=== BOOKING FORM SUBMISSION END ===');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-12 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative mx-auto max-w-7xl text-center">
                    <div className="mb-6 flex justify-center space-x-4 text-6xl">
                        <span className="animate-bounce">🐕</span>
                        <span className="animate-pulse">🐱</span>
                        <span className="animate-bounce">🐾</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                        Book Your Pet's
                        <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                            Perfect Day
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-orange-100 sm:text-xl">
                        Professional pet care services in Dubai. From grooming to adoption, we're here to make your furry friend happy!
                    </p>
                </div>
                <div className="absolute -bottom-1 left-0 right-0 h-20 bg-gradient-to-t from-orange-50 to-transparent"></div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">

                    {/* Booking Form */}
                    <div className="order-2 lg:order-1">
                        <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-gray-200 sm:p-10">
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                    Book Now
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    Fill out the form below and we'll get back to you soon!
                                </p>
                            </div>

                            {/* Status Messages */}
                            {submitStatus === 'success' && (
                                <div className="mb-6 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">✅</span>
                                        <div>
                                            <h3 className="font-semibold text-green-800">Booking Confirmed!</h3>
                                            <p className="text-green-600">We'll contact you soon to confirm the details.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {submitStatus === 'error' && (
                                <div className="mb-6 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">❌</span>
                                        <div>
                                            <h3 className="font-semibold text-red-800">Oops! Something went wrong</h3>
                                            <p className="text-red-600">Please try again or contact us directly.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                                            placeholder="+971 50 123 4567"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                                        placeholder="your.email@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pet Type
                                    </label>
                                    <select
                                        name="service"
                                        value={formData.service}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                                        required
                                    >
                                        <option value="Dog">🐕 Dog</option>
                                        <option value="Cat">🐱 Cat</option>
                                        <option value="Bird">🐦 Bird</option>
                                        <option value="Others">🐾 Others</option>
                                    </select>
                                </div>

                                {/* Grooming Type Selection - Show for all pet types */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Choose Grooming Package
                                    </label>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {/* Basic Groom Option */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${formData.groomingType === 'Basic Groom'
                                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                                                }`}
                                            onClick={() => setFormData(prev => ({ ...prev, groomingType: 'Basic Groom' }))}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="groomingType"
                                                    value="Basic Groom"
                                                    checked={formData.groomingType === 'Basic Groom'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                                />
                                                <div className="ml-3">
                                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                                        <span className="mr-2">🛁</span>
                                                        Basic Groom
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">Perfect for regular maintenance</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-500">
                                                <p>✓ Bath with premium shampoo</p>
                                                <p>✓ Basic brushing</p>
                                                <p>✓ Nail trimming</p>
                                                <p>✓ Ear cleaning</p>
                                                <p>✓ Basic styling</p>
                                                <p>✓ Teeth cleaning</p>
                                                <p>✓ Perfume spray</p>
                                            </div>
                                        </div>

                                        {/* Full Groom Option */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${formData.groomingType === 'Full Groom'
                                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                                                }`}
                                            onClick={() => setFormData(prev => ({ ...prev, groomingType: 'Full Groom' }))}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="groomingType"
                                                    value="Full Groom"
                                                    checked={formData.groomingType === 'Full Groom'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                                />
                                                <div className="ml-3">
                                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                                        <span className="mr-2">⭐</span>
                                                        Full Groom
                                                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                                                            Popular
                                                        </span>
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">Complete luxury experience</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-500">
                                                <p>✓ Premium bath with conditioning</p>
                                                <p>✓ Professional brushing & de-shedding</p>
                                                <p>✓ Nail trimming & filing</p>
                                                <p>✓ Ear cleaning & plucking</p>
                                                <p>✓ Professional styling & trimming</p>
                                                <p>✓ Teeth cleaning</p>
                                                <p>✓ Perfume spray</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                                        placeholder="Any specific requests or concerns about your pet..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full rounded-2xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 ${isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 hover:shadow-xl transform hover:-translate-y-1'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <span className="mr-2">🐾</span>
                                            Book My Pet's Service
                                        </div>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Information & Features */}
                    <div className="order-1 lg:order-2 space-y-6">

                        {/* Contact Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                        <span className="text-2xl">📞</span>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                                        <p className="text-green-600 font-medium">+971 56 418 0500</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                        <span className="text-2xl">✉️</span>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Email Us</h3>
                                        <p className="text-blue-600 font-medium text-sm">petsgallery033@gmail.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 hover:shadow-xl transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-start">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Visit Us</h3>
                                        <div className="text-center">
                                            <p className="text-purple-600 font-medium">
                                                Al Wasl Sports Club Stadium, Building Shop #33
                                            </p>
                                            <p className="text-purple-600 font-medium">
                                                Nouras Street, Al Jaddaf
                                            </p>
                                            <p className="text-purple-600 font-medium">
                                                Dubai
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Why Choose Us */}
                        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-8 text-white">
                            <h3 className="text-2xl font-bold mb-6">Why Choose Pets Gallery?</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <span className="text-2xl mr-4">🏆</span>
                                    <div>
                                        <h4 className="font-semibold">Expert Care</h4>
                                        <p className="text-orange-100 text-sm">Professional staff with years of experience</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-2xl mr-4">❤️</span>
                                    <div>
                                        <h4 className="font-semibold">Loving Environment</h4>
                                        <p className="text-orange-100 text-sm">Your pets are treated like family</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-2xl mr-4">⚡</span>
                                    <div>
                                        <h4 className="font-semibold">Quick Service</h4>
                                        <p className="text-orange-100 text-sm">Fast and efficient pet care services</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-2xl mr-4">🛡️</span>
                                    <div>
                                        <h4 className="font-semibold">Safe and Secure</h4>
                                        <p className="text-orange-100 text-sm">Highest safety standards for your pets</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Hours */}
                        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="text-2xl mr-2">🕒</span>
                                Business Hours
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monday - Friday</span>
                                    <span className="font-medium text-gray-900">10:00 AM - 11:30 PM</span>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;