// @ts-nocheck
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  User,
  Building2,
  FileText,
  UploadCloud
} from "lucide-react";

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  useSEO(
    "Contact Mayank Raw Mint | Get Quote for Brass Fittings",
    "Request quotes or custom orders for precision brass fittings. Email info@mayankrawmint.com or call +91-96245 33303."
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function onSubmit(values) {
    try {
      setSubmitting(true);
      let photoUrl = null;

      if (values.photo?.[0]) {
        setUploading(true);
        photoUrl = await uploadToCloudinary(values.photo[0]);
        setUploading(false);
      }

      const payload = {
        name: values.name.trim(),
        contactNumber: values.contactNumber?.trim() || "",
        email: values.email?.trim() || "",
        companyName: values.companyName?.trim() || "",
        description: values.description?.trim() || "",
        photoUrl,
      };

      await api.post("/contacts", payload);
      toast.success("Thanks! Your query has been submitted.");
      reset();
      setPreview(null);
    } catch (e) {
      const m = e?.response?.data?.message || e.message || "Something went wrong";
      toast.error(m);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">CONTACT US</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Ready to discuss your metal and raw material requirements? We're here to help you find the perfect solution for your business needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Two Column Layout - Adjusted widths */}
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left Column - Contact Information (30-40%) */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Address Card */}
            {/* <motion.div 
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Address</h3>
              </div>
              <p className="text-gray-600">
                Plot No. 10 to 15, Survey No.421,<br />
                B/H Murlidhar Tractor, Hapa,<br />
                Jamnagar - Rajkot Highway,<br />
                Jamnagar - 361120 (Gujarat) INDIA
              </p>
            </motion.div> */}

            {/* Phone Card */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Phone</h3>
              </div>
              <div className="space-y-1">
                <a href="tel:+919624533303" className="block text-gray-600 hover:text-green-600 transition-colors">
                  (+91) 96245 33303
                </a>
                <a href="tel:+917878787819" className="block text-gray-600 hover:text-green-600 transition-colors">
                  (+91) 78787 87819
                </a>
              </div>
            </motion.div>

            {/* Email Card */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Email</h3>
              </div>
              <div className="space-y-1">
                <a href="mailto:keyur@mayankrawmint.com" className="block text-gray-600 hover:text-green-600 transition-colors">
                  keyur@mayankrawmint.com
                </a>
                <a href="mailto:info@mayankrawmint.com" className="block text-gray-600 hover:text-green-600 transition-colors">
                  info@mayankrawmint.com
                </a>
              </div>
            </motion.div>

            {/* Social Card */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Socials</h3>
              </div>
              <div className="flex gap-4">
                {/* LinkedIn Icon */}
                <a
                  href="https://www.linkedin.com/company/mayank-raw-mint"
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 rounded-lg transition-colors group"
                  title="Visit our LinkedIn"
                >
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                
                {/* YouTube Icon */}
                <a
                  href="https://www.youtube.com/@mayankrawmintpvt.ltd.7687"
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 rounded-lg transition-colors group"
                  title="Visit our YouTube"
                >
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </motion.div>

            {/* Office Card */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Office</h3>
              </div>
              <p className="text-gray-600">
                Plot No. 10 to 15, Survey No.421,<br />
                B/H Murlidhar Tractor, Hapa,<br />
                Jamnagar - Rajkot Highway,<br />
                Jamnagar - 361120 (Gujarat) INDIA
              </p>
            </motion.div>

            {/* Business Hours Card */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Business Hours</h3>
              </div>
              <div className="space-y-1 text-gray-600">
                <p>Monday to Thursday: 08:00 - 19:00</p>
                <p>Saturday & Sunday: 08:00 - 18:00</p>
                <p>Friday: Holiday</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Contact Form (60-70%) */}
          <motion.div 
            className="lg:col-span-3 space-y-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Contact Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* First Row - Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register("name", { required: "Name is required" })}
                        type="text"
                        placeholder="Your name"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        type="email"
                        placeholder="your.email@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Second Row - Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register("contactNumber")}
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register("companyName")}
                      type="text"
                      placeholder="Your company"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      {...register("description")}
                      rows={4}
                      placeholder="Tell us what you need..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Attach Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Photo (optional)
                  </label>
                  <label className="flex items-center gap-3 border border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <UploadCloud className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Choose an image...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      {...register("photo")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                  </label>
                  {(uploading || submitting) && (
                    <span className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      {uploading ? "Uploading..." : "Submitting..."}
                    </span>
                  )}
                  {preview && (
                    <img src={preview} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-lg border" />
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={uploading || submitting}
                  className="cursor-pointer w-full md:w-auto px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Map Section - Below Form in Right Column */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Find Us</h3>
              <div className="overflow-hidden rounded-lg">
                <iframe
                  title="Mayank Raw Mint Office Map"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15100861.930622373!2d70.116536!3d22.476633!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39576a6c2ec28a27%3A0x19f5cf5015c257e6!2sMayank%20Raw%20Mint%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1756482384713!5m2!1sen!2sin"
                  className="w-full h-[400px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Full Width Image Section */}
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <img
          src="/optimized/site/contact-1600.webp"
          alt="Mayank Raw Mint Office"
          className="w-full h-auto object-contain"
        />
      </motion.div>
    </div>
  );
}
