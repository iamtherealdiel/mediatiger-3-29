import { useState, useRef, useEffect } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import PayoutDashboard from "./PayoutDashboard";

// Props for the component

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
      <PayoutDashboard
        setHasContract={setHasContract}
        uploadImage={uploadSignatureImage}
        handleSubmitData={handleSubmit}
        user={user}
        hasContract={hasContract}
        currentBalance={1}
      />
    </div>
  );
};

export default BalanceSection;
