import React, { useState, useRef, useEffect } from "react";
import { DollarSign, FileText, CheckCircle, Calendar, Target, Settings, X, Plus, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface PayoutHistory {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  payout_date: string;
  method: string;
}

// Props for the component
interface MonthlyGoalsProps {
  user: any;
}

const PayoutHistorySection = () => {
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayoutHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('payouts')
          .select('*')
          .order('payout_date', { ascending: false });

        if (error) throw error;
        setPayouts(data || []);
      } catch (error) {
        console.error('Error fetching payout history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayoutHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No payout history available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Payouts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Payouts</h3>
        <div className="space-y-3">
          {payouts
            .filter(payout => payout.status === 'pending')
            .map(payout => (
              <div 
                key={payout.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">${payout.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">
                      Expected {new Date(payout.payout_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="px-3 py-1 text-sm bg-indigo-500/20 text-indigo-300 rounded-full">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Past Payouts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Past Payouts</h3>
        <div className="space-y-3">
          {payouts
            .filter(payout => payout.status === 'completed')
            .map(payout => (
              <div 
                key={payout.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">${payout.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">
                      Paid via {payout.method} • {new Date(payout.payout_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="px-3 py-1 text-sm bg-green-500/20 text-green-300 rounded-full">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const BalanceSection = () => {
  const [signatureMethod, setSignatureMethod] = useState("type");
  const [signatureImage, setSignatureImage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const signaturePadRef = useRef(null);
  const [checked, setChecked] = useState(false);
  const [hasContract, setHasContract] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const clearSignature = () => {
    setSignatureImage("");
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const [formData, setFormData] = useState({
    legalName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    signature_text: "",
    signature_url: "",
  });

  const getContractDetails = async () => {
    try {
      setLoading(true);
      const { data: contractData, error: contractError } = await supabase
        .from("contract")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (contractError) {
        console.error("Error fetching contract:", contractError.message);
        return null;
      }

      if (!contractData) {
        console.log("No contract found for user");
        return null;
      }

      return contractData;
    } catch (error) {
      console.error("Unexpected error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL();
      setSignatureImage(dataUrl);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Basic field validation
    if (!formData.legalName || formData.legalName.trim() === "") {
      errors.legalName = "Legal name is required";
    }

    if (!formData.address || formData.address.trim() === "") {
      errors.address = "Address is required";
    }

    if (!formData.city || formData.city.trim() === "") {
      errors.city = "City is required";
    }

    if (!formData.state || formData.state.trim() === "") {
      errors.state = "State/Province is required";
    }

    if (!formData.zip || formData.zip.trim() === "") {
      errors.zip = "ZIP/Postal Code is required";
    }

    if (!formData.country || formData.country.trim() === "") {
      errors.country = "Country is required";
    }

    // Signature validation
    if (signatureMethod === "type") {
      if (!formData.signature_text || formData.signature_text.trim() === "") {
        errors.signature = "Please type your signature";
      }
    } else if (signatureMethod === "draw") {
      if (!signatureImage) {
        errors.signature = "Please draw your signature";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to upload a base64 image to Supabase storage
  const uploadSignatureImage = async (base64Image) => {
    try {
      // Convert base64 to blob
      const base64Response = await fetch(base64Image);
      const blob = await base64Response.blob();

      // Generate a unique file name
      const fileName = `signatures/${user?.id}_${new Date().getTime()}.png`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("signatures")
        .upload(fileName, blob, {
          upsert: true,
        });

      if (error) {
        console.error("Error uploading signature:", error.message);
        return null;
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error in upload process:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a copy of the form data
      let dataToSubmit = { ...formData, user_id: user?.id };

      // Handle signature based on method
      if (signatureMethod === "type") {
        // For typed signatures, just save the text
        dataToSubmit.signature_url = null; // Clear any previous image
      } else if (signatureMethod === "draw" && signatureImage) {
        // For drawn signatures, upload the image and save the URL
        const imageUrl = await uploadSignatureImage(signatureImage);

        if (imageUrl) {
          dataToSubmit.signature_url = imageUrl;
          dataToSubmit.signature_text = null; // Clear any previous text signature
        } else {
          setValidationErrors({
            ...validationErrors,
            signature: "Failed to upload signature image",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Insert or update the contract in Supabase
      const operation = hasContract ? "update" : "insert";

      let result;
      if (operation === "insert") {
        result = await supabase.from("contract").insert(dataToSubmit);
      } else {
        result = await supabase
          .from("contract")
          .update(dataToSubmit)
          .eq("user_id", user?.id);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Update the UI to show success
      setHasContract(true);
      toast.success(
        `Contract successfully ${hasContract ? "updated" : "submitted"}!`
      );
    } catch (error) {
      console.error("Error submitting contract:", error);
      setValidationErrors({
        ...validationErrors,
        form: `Error: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field if it exists
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Check if user has a valid signature based on current method
  const hasValidSignature = () => {
    if (signatureMethod === "type") {
      return formData.signature_text && formData.signature_text.trim() !== "";
    } else {
      return signatureImage && signatureImage !== "";
    }
  };

  useEffect(() => {
    getContractDetails().then((res) => {
      if (res) {
        setHasContract(true);
        setFormData(res);

        // If there's a signature image in the contract data, set it
        if (res.signature_url) {
          setSignatureImage(res.signature_url);
          setSignatureMethod("draw");
        }

        // If there's a signature text in the contract data, set the method to type
        if (res.signature_text) {
          setSignatureMethod("type");
        }

        return;
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-slate-300">Loading... </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main content */}
      <div className="flex-1 p-6">
        {/* Current Balance */}
        {!hasContract && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-yellow-500 text-sm">
                Payouts will be processed after accepting the terms and
                conditions
              </p>
            </div>
          </div>
        )}
        <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white mb-6">
          <div className="flex items-center mb-1">
            <DollarSign className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-medium">Current Balance</h2>
            <div className="ml-auto text-sm">Next payment: March 31, 2025</div>
          </div>
          <div className="text-4xl font-bold">$0.00</div>
        </div>

        {/* Payment Threshold */}
        <div className="bg-gray-800 rounded-lg p-6 my-6">
          <div className="flex items-start">
            <Calendar className="w-5 h-5 mr-3 mt-1 text-gray-400" />
            <div>
              <div className="font-medium text-white">
                Minimum payment threshold: $100.00
              </div>
              <div className="text-sm text-gray-400">
                $100.00 more needed for next payment
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 mt-3">
          <h3 className="text-lg font-medium mb-4 text-white">
            Available Payment Methods
          </h3>
          <ul className="space-y-3 text-white">
            {[
              "ACH (US)",
              "Local Bank Transfer",
              "International ACH (eCheck)",
              "Paper Check",
              "US Wire Transfer (Domestic)",
              "International Wire in Local Currency",
              "International Wire in USD",
              "PayPal",
            ].map((method, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                <span>{method}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payout History Section */}
        <div className="bg-slate-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payout History</h3>
          <PayoutHistorySection />
        </div>

        {/* Stats counter */}
        <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <span>
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>

        {/* Terms and Conditions */}
        {!hasContract && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    onClick={() => setChecked((prev) => !prev)}
                    checked={checked}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className="text-blue-400 text-sm hover:text-blue-300 transition-colors cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    I agree to the Terms and Conditions
                  </span>
                </div>
              </div>
            </div>

            {/* Terms Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Terms and Conditions
                  </h2>
                  <div className="max-h-96 overflow-y-auto text-gray-300 text-sm mb-4">
                    {/* Terms content - abbreviated for brevity */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">1. Introduction</h3>
                      <p>
                        Thank you for your interest in MediaTiger! We empower
                        creators to maximize revenue and enhance content
                        creation through innovative tools and partnerships.
                      </p>
                      {/* Additional terms content would be here */}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Contract Agreement */}

        {checked && (
          <div className="bg-gray-800 rounded-lg p-6 my-6">
            <div className="flex items-start mb-4">
              <FileText className="w-5 h-5 mr-3 mt-1 text-gray-400" />
              <div>
                <div className="font-medium text-white">Contract Agreement</div>
                <div className="text-sm text-gray-400">
                  Please review and sign the terms of service agreement
                </div>
              </div>
            </div>

            {/* Display validation error summary if any */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-md p-3 mb-4 text-red-300 text-sm">
                <p className="font-medium mb-1">
                  Please correct the following errors:
                </p>
                <ul className="list-disc pl-5">
                  {Object.values(validationErrors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <form className="space-y-4 text-white" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Legal Name
                </label>
                <input
                  value={formData.legalName}
                  name="legalName"
                  type="text"
                  onChange={handleInputChange}
                  placeholder="Enter your legal full name"
                  className={`w-full p-3 bg-gray-700 rounded-md border ${
                    validationErrors.legalName
                      ? "border-red-500"
                      : "border-gray-600"
                  } text-white`}
                />
                {validationErrors.legalName && (
                  <p className="mt-1 text-red-400 text-xs">
                    {validationErrors.legalName}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Street Address
                </label>
                <input
                  value={formData.address}
                  name="address"
                  type="text"
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  className={`w-full p-3 bg-gray-700 rounded-md border ${
                    validationErrors.address
                      ? "border-red-500"
                      : "border-gray-600"
                  } text-white`}
                />
                {validationErrors.address && (
                  <p className="mt-1 text-red-400 text-xs">
                    {validationErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">City</label>
                  <input
                    type="text"
                    name="city"
                    onChange={handleInputChange}
                    value={formData.city}
                    placeholder="City"
                    className={`w-full p-3 bg-gray-700 rounded-md border ${
                      validationErrors.city
                        ? "border-red-500"
                        : "border-gray-600"
                    } text-white`}
                  />
                  {validationErrors.city && (
                    <p className="mt-1 text-red-400 text-xs">
                      {validationErrors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    onChange={handleInputChange}
                    value={formData.state}
                    placeholder="State/Province"
                    className={`w-full p-3 bg-gray-700 rounded-md border ${
                      validationErrors.state
                        ? "border-red-500"
                        : "border-gray-600"
                    } text-white`}
                  />
                  {validationErrors.state && (
                    <p className="mt-1 text-red-400 text-xs">
                      {validationErrors.state}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    name="zip"
                    onChange={handleInputChange}
                    value={formData.zip}
                    placeholder="ZIP/Postal Code"
                    className={`w-full p-3 bg-gray-700 rounded-md border ${
                      validationErrors.zip
                        ? "border-red-500"
                        : "border-gray-600"
                    } text-white`}
                  />
                  {validationErrors.zip && (
                    <p className="mt-1 text-red-400 text-xs">
                      {validationErrors.zip}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    onChange={handleInputChange}
                    placeholder="Country"
                    value={formData.country}
                    className={`w-full p-3 bg-gray-700 rounded-md border ${
                      validationErrors.country
                        ? "border-red-500"
                        : "border-gray-600"
                    } text-white`}
                  />
                  {validationErrors.country && (
                    <p className="mt-1 text-red-400 text-xs">
                      {validationErrors.country}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Electronic Signature
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setSignatureMethod("type")}
                      className={`px-4 py-2 rounded-md ${
                        signatureMethod === "type"
                          ? "bg-indigo-600"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      Type Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureMethod("draw");
                        clearSignature();
                      }}
                      className={`px-4 py-2 rounded-md ${
                        signatureMethod === "draw"
                          ? "bg-indigo-600"
                          : "bg-gray-600 hover:bg-indigo-700"
                      }`}
                    >
                      Draw Signature
                    </button>
                  </div>

                  <div
                    className={`mb-2 ${
                      validationErrors.signature
                        ? "border border-red-500 rounded-md"
                        : ""
                    }`}
                  >
                    {signatureMethod === "type" ? (
                      <input
                        type="text"
                        name="signature_text"
                        value={formData.signature_text || ""}
                        placeholder="Type your signature"
                        className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 text-white"
                        onChange={handleInputChange}
                      />
                    ) : (
                      <div className="w-full bg-white rounded-md overflow-hidden">
                        {signatureImage ? (
                          <img
                            src={signatureImage}
                            alt="Signature"
                            className="w-full h-32 object-contain"
                          />
                        ) : (
                          <SignatureCanvas
                            ref={signaturePadRef}
                            canvasProps={{
                              className: "w-full h-32",
                            }}
                            backgroundColor="white"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {validationErrors.signature && (
                    <p className="mt-1 text-red-400 text-xs mb-2">
                      {validationErrors.signature}
                    </p>
                  )}

                  {signatureMethod === "draw" && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
                        onClick={clearSignature}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500"
                        onClick={saveSignature}
                      >
                        Save Signature
                      </button>
                    </div>
                  )}

                  <div className="text-sm text-gray-400 mt-2">
                    {signatureMethod === "draw"
                      ? "Draw your signature using your mouse or touch screen"
                      : "Type your signature using your keyboard"}
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : hasContract ? (
                      "Update Agreement"
                    ) : (
                      "Submit Agreement"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceSection;