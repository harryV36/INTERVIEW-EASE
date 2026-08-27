


// // ============================================
// // src/components/Organization/AcceptInvitePage.jsx
// // ============================================
// import React, { useState } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";
// import { CheckCircle, XCircle } from "lucide-react";

// const AcceptInvitePage = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const [processing, setProcessing] = useState(false);

//   const handleAccept = async () => {
//     try {
//       setProcessing(true);
//       const authToken = localStorage.getItem("token");
      
//       const res = await axios.post(
//         `http://localhost:8000/api/organization/accept-invite/${token}`,
//         {},
//         { headers: { Authorization: `Bearer ${authToken}` } }
//       );

//       if (res.data.success) {
//         alert("Successfully joined the organization!");
//         navigate("/profile");
//       }
//     } catch (err) {
//       alert(err.response?.data?.msg || "Failed to accept invitation");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleDecline = async () => {
//     try {
//       setProcessing(true);
//       await axios.post(
//         `http://localhost:8000/api/organization/decline-invite/${token}`
//       );
      
//       alert("Invitation declined");
//       navigate("/");
//     } catch (err) {
//       alert("Failed to decline invitation");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
//       <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
//         <h1 className="text-2xl font-bold text-gray-900 mb-4">
//           Organization Invitation
//         </h1>
//         <p className="text-gray-600 mb-8">
//           You've been invited to join an organization. Accept to become a member and participate in team interviews.
//         </p>

//         <div className="flex gap-4">
//           <button
//             onClick={handleAccept}
//             disabled={processing}
//             className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
//           >
//             <CheckCircle size={20} />
//             Accept
//           </button>
          
//           <button
//             onClick={handleDecline}
//             disabled={processing}
//             className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
//           >
//             <XCircle size={20} />
//             Decline
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AcceptInvitePage;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Building2,
  Users,
  Calendar,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000";

const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);

  // ---------------------------
  // Fetch invitation details
  // ---------------------------
  useEffect(() => {
    fetchInvitationDetails();
    // eslint-disable-next-line
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/organization/accept-invite/${token}`
      );

      if (res.data.success) {
        setInvitation(res.data);
      } else {
        setError(res.data.msg || "Invalid invitation");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Accept invitation
  // ---------------------------
  const handleAccept = async () => {
    const authToken = localStorage.getItem("token");

    if (!authToken) {
      localStorage.setItem("pendingInvitation", token);
      navigate("/home/login");
      return;
    }

    try {
      setProcessing(true);
      const res = await axios.post(
        `${API_BASE}/api/organization/accept-invite/${token}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.data.success) {
        alert("Successfully joined the organization!");
        navigate("/org/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to accept invitation");
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------
  // Decline invitation
  // ---------------------------
  const handleDecline = async () => {
    if (!window.confirm("Are you sure you want to decline this invitation?")) {
      return;
    }

    try {
      setProcessing(true);
      await axios.post(
        `${API_BASE}/org/decline-invite/${token}`
      );

      alert("Invitation declined");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to decline invitation");
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------
  // Loading state
  // ---------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  // ---------------------------
  // Error state
  // ---------------------------
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // Main UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Organization Invitation</h1>
              <p className="text-purple-100">Join your team workspace</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold mb-2">
            {invitation.organizationName}
          </h2>

          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <Mail size={16} />
            <span>{invitation.email}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Benefit icon={<Users />} text="Team collaboration" />
            <Benefit icon={<Calendar />} text="Interview scheduling" />
            <Benefit icon={<Building2 />} text="Org dashboard" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle />
              )}
              Accept
            </button>

            <button
              onClick={handleDecline}
              disabled={processing}
              className="flex-1 bg-white border border-red-300 text-red-600 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <XCircle />
              )}
              Decline
            </button>
          </div>

          {!localStorage.getItem("token") && (
            <p className="text-sm text-center text-gray-500 mt-4">
              You’ll be asked to log in before joining
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Benefit = ({ icon, text }) => (
  <div className="bg-purple-50 rounded-xl p-4 text-center">
    <div className="flex justify-center mb-2 text-purple-600">{icon}</div>
    <p className="text-sm text-gray-700">{text}</p>
  </div>
);

export default AcceptInvitePage;
