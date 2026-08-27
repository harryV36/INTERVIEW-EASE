// // controllers/organizationController.js
// import Organization from "../models/Organization.js";
// import User from "../models/User.js";
// import { createTransport } from "nodemailer";
// import crypto from "crypto";
// import { log } from "console";
// import mongoose from "mongoose";
// import InterviewSession from "../models/InterviewSession.js";
// import Scorecard from "../models/Scorecard.js";

// // test



// export const validateInvitation = async (req, res) => {
//   const { token } = req.params;

//   const organization = await Organization.findOne({
//     "invitations.token": token,
//     "invitations.status": "pending",
//   }).select("name invitations");

//   if (!organization) {
//     return res.status(404).json({
//       success: false,
//       msg: "Invalid or expired invitation",
//     });
//   }

//   const invitation = organization.invitations.find(
//     (inv) => inv.token === token
//   );

//   if (invitation.expiresAt < new Date()) {
//     invitation.status = "expired";
//     await organization.save();
//     return res.status(400).json({
//       success: false,
//       msg: "Invitation expired",
//     });
//   }

//   res.json({
//     success: true,
//     organizationName: organization.name,
//     email: invitation.email,
//   });
// };


// // Create Organization
// export const createOrganization = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { name, email, description, website, industry, size } = req.body;

//     // Check if user already owns an organization
//     const existingOrg = await Organization.findOne({ ownerId: userId });
//     if (existingOrg) {
//       return res.status(400).json({
//         success: false,
//         msg: "You already own an organization",
//       });
//     }

//     // Check if organization email already exists
//     const emailExists = await Organization.findOne({ email });
//     if (emailExists) {
//       return res.status(400).json({
//         success: false,
//         msg: "Organization email already registered",
//       });
//     }

//     // Create organization
//     const organization = await Organization.create({
//       name,
//       email,
//       ownerId: userId,
//       description,
//       website,
//       industry,
//       size,
//       members: [],
//       invitations: [],
//       settings: {
//         allowMemberInvites: false,
//         requireApprovalForJoin: true,
//         autoScheduleInterviews: false,
//       },
//       subscription: {
//         plan: "free",
//         maxMembers: 10,
//         features: [],
//       },
//     });

//     // Update user role to organization
//     await User.findByIdAndUpdate(userId, {
//       role: "organization",
//       organizationId: organization._id,
//     });

//     res.json({
//       success: true,
//       msg: "Organization created successfully",
//       organization,
//     });
//   } catch (err) {
//     console.error("Create organization error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Get Organization Details
// export const getOrganization = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const organization = await Organization.findOne({
//       $or: [
//         { ownerId: userId },
//         { "members.userId": userId },
//       ],
//     }).populate("ownerId", "name email");

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         msg: "Organization not found",
//       });
//     }

//     res.json({
//       success: true,
//       organization,
//     });
//   } catch (err) {
//     console.error("Get organization error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Update Organization
// export const updateOrganization = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const updates = req.body;

//     const organization = await Organization.findOne({ ownerId: userId });

//     if (!organization) {
//       return res.status(403).json({
//         success: false,
//         msg: "You don't have permission to update this organization",
//       });
//     }

//     // Update allowed fields
//     const allowedFields = [
//       "name",
//       "description",
//       "website",
//       "industry",
//       "size",
//       "logo",
//       "settings",
//     ];

//     Object.keys(updates).forEach((key) => {
//       if (allowedFields.includes(key)) {
//         if (key === "settings") {
//           organization.settings = { ...organization.settings, ...updates.settings };
//         } else {
//           organization[key] = updates[key];
//         }
//       }
//     });

//     await organization.save();

//     res.json({
//       success: true,
//       msg: "Organization updated successfully",
//       organization,
//     });
//   } catch (err) {
//     console.error("Update organization error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Send Invitation
// export const sendInvitation = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { email } = req.body;

//     const organization = await Organization.findOne({
//       $or: [{ ownerId: userId }, { "members.userId": userId, "members.role": "admin" }],
//     });

//     if (!organization) {
//       return res.status(403).json({
//         success: false,
//         msg: "You don't have permission to send invitations",
//       });
//     }

//     // Check if already a member
//     const existingMember = organization.members.find((m) => m.email === email);
//     if (existingMember) {
//       return res.status(400).json({
//         success: false,
//         msg: "User is already a member",
//       });
//     }

//     // Check if invitation already sent
//     const existingInvitation = organization.invitations.find(
//       (inv) => inv.email === email && inv.status === "pending"
//     );
//     if (existingInvitation) {
//       return res.status(400).json({
//         success: false,
//         msg: "Invitation already sent to this email",
//       });
//     }

//     // Check member limit
//     if (organization.members.length >= organization.subscription.maxMembers) {
//       return res.status(400).json({
//         success: false,
//         msg: "Member limit reached. Please upgrade your plan.",
//       });
//     }

//     // Generate invitation token
//     const token = crypto.randomBytes(32).toString("hex");
//     const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

//     // Add invitation
//     organization.invitations.push({
//       email,
//       invitedBy: userId,
//       status: "pending",
//       token,
//       expiresAt,
//     });

//     await organization.save();

//     // Send email
//     const inviteLink = `${process.env.FRONTEND_URL}/org/accept-invite/${token}`;
    
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: `Invitation to join ${organization.name}`,
//       html: `
//         <h2>You've been invited to join ${organization.name}</h2>
//         <p>Click the link below to accept the invitation:</p>
//         <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
//           Accept Invitation
//         </a>
//         <p>Or copy this link: ${inviteLink}</p>
//         <p>This invitation will expire in 7 days.</p>
//       `,
//     });

//     res.json({
//       success: true,
//       msg: "Invitation sent successfully",
//     });
//   } catch (err) {
//     console.error("Send invitation error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Accept Invitation
// export const acceptInvitation = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { token } = req.params;
//     console.log("hello");
    
//     console.log(userId,token);
    
//     const organization = await Organization.findOne({
//       "invitations.token": token,
//       "invitations.status": "pending",
      
//     });

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         msg: "Invalid or expired invitation",
//       });
//     }

//     const invitation = organization.invitations.find(
//       (inv) => inv.token === token
//     );

//     // Check if expired
//     if (invitation.expiresAt < new Date()) {
//       invitation.status = "expired";
//       await organization.save();
//       return res.status(400).json({
//         success: false,
//         msg: "Invitation has expired",
//       });
//     }

//     // Get user details
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         msg: "User not found",
//       });
//     }

//     // Add as member
//     organization.members.push({
//       userId: user._id,
//       email: user.email,
//       name: user.name,
//       role: "member",
//       status: "active",
//       joinedAt: new Date(),
//     });

//     // Update invitation status
//     invitation.status = "accepted";

//     await organization.save();

//     // Update user's organization reference
//     user.organizationId = organization._id;
//     await user.save();

//     res.json({
//       success: true,
//       msg: "Successfully joined the organization",
//       organization,
//     });
//   } catch (err) {
//     console.error("Accept invitation error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Decline Invitation
// export const declineInvitation = async (req, res) => {
//   try {
//     const { token } = req.params;

//     const organization = await Organization.findOne({
//       "invitations.token": token,
//       "invitations.status": "pending",
//     });

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         msg: "Invalid invitation",
//       });
//     }

//     const invitation = organization.invitations.find(
//       (inv) => inv.token === token
//     );

//     invitation.status = "declined";
//     await organization.save();

//     res.json({
//       success: true,
//       msg: "Invitation declined",
//     });
//   } catch (err) {
//     console.error("Decline invitation error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Remove Member
// export const removeMember = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { memberId } = req.params;

//     const organization = await Organization.findOne({
//       $or: [{ ownerId: userId }, { "members.userId": userId, "members.role": "admin" }],
//     });

//     if (!organization) {
//       return res.status(403).json({
//         success: false,
//         msg: "You don't have permission to remove members",
//       });
//     }

//     // Cannot remove owner
//     if (memberId === organization.ownerId.toString()) {
//       return res.status(400).json({
//         success: false,
//         msg: "Cannot remove organization owner",
//       });
//     }

//     // Remove member
//     organization.members = organization.members.filter(
//       (m) => m.userId.toString() !== memberId
//     );

//     await organization.save();

//     // Update user's organization reference
//     await User.findByIdAndUpdate(memberId, {
//       organizationId: null,
//     });

//     res.json({
//       success: true,
//       msg: "Member removed successfully",
//     });
//   } catch (err) {
//     console.error("Remove member error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Update Member Role
// export const updateMemberRole = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { memberId } = req.params;
//     const { role } = req.body;

//     const organization = await Organization.findOne({ ownerId: userId });

//     if (!organization) {
//       return res.status(403).json({
//         success: false,
//         msg: "Only organization owner can update member roles",
//       });
//     }

//     const member = organization.members.find(
//       (m) => m.userId.toString() === memberId
//     );

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         msg: "Member not found",
//       });
//     }

//     member.role = role;
//     await organization.save();

//     res.json({
//       success: true,
//       msg: "Member role updated successfully",
//       member,
//     });
//   } catch (err) {
//     console.error("Update member role error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // Get Members Performance
// export const getMembersPerformance = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const organization = await Organization.findOne({
//       $or: [{ ownerId: userId }, { "members.userId": userId, "members.role": "admin" }],
//     });

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         msg: "Organization not found",
//       });
//     }

//     // Get performance data for each member
//     // This would typically come from your InterviewSession and Scorecard models
//     // For now, returning basic member info
//     const membersWithPerformance = await Promise.all(
//       organization.members.map(async (member) => {
//         // TODO: Query InterviewSession and Scorecard models for actual performance data
//         return {
//           ...member.toObject(),
//           performance: {
//             totalInterviews: 0,
//             avgScore: 0,
//             recentScores: [],
//           },
//         };
//       })
//     );

//     res.json({
//       success: true,
//       members: membersWithPerformance,
//     });
//   } catch (err) {
//     console.error("Get members performance error:", err);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// };

// // controllers/organizationController.js (ADD THIS METHOD)

// export const getMemberScores = async (req, res) => {
//   try {
//     const adminUserId = req.user.id;
//     const { memberId } = req.params;

//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(memberId)) {
//       return res.status(400).json({
//         success: false,
//         msg: "Invalid member ID",
//       });
//     }

//     // Check admin permission
//     const organization = await Organization.findOne({
//       $or: [
//         { ownerId: adminUserId },
//         { "members.userId": adminUserId, "members.role": "admin" },
//       ],
//     });

//     if (!organization) {
//       return res.status(403).json({
//         success: false,
//         msg: "You don't have permission to view member scores",
//       });
//     }

//     // Check member belongs to org
//     const isMember = organization.members.some(
//       (m) => m.userId.toString() === memberId
//     );

//     if (!isMember) {
//       return res.status(404).json({
//         success: false,
//         msg: "Member not found in organization",
//       });
//     }

//     // Fetch scorecards
//     const scores = await Scorecard.find({ userId: memberId })
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .lean(); // ✅ faster & cleaner

//     // Normalize response (safe defaults)
//     const formattedScores = scores.map((s) => ({
//       id: s._id,
//       createdAt: s.createdAt,
//       role: s.role || "",
//       overallScore: s.scores?.overallScore ?? 0,
//       overallBand: s.overallBand || "Not Rated",
//       overallMessage: s.overallMessage || "",

//       scores: {
//         fluency: s.scores?.fluency ?? 0,
//         confidence: s.scores?.confidence ?? 0,
//         technicalAccuracy: s.scores?.technicalAccuracy ?? 0,
//         keywordUsage: s.scores?.keywordUsage ?? 0,
//         aiVideoScore: s.scores?.aiVideoScore ?? 0,
//         consistencyScore: s.scores?.consistencyScore ?? 0,
//       },

//       mcqSummary: s.mcqSummary || {
//         totalQuestions: 0,
//         correct: 0,
//         scorePercent: 0,
//       },

//       codingSummary: s.codingSummary || {
//         totalQuestions: 0,
//         averageScore: 0,
//       },
//     }));

//     return res.json({
//       success: true,
//       count: formattedScores.length,
//       scores: formattedScores,
//     });
//   } catch (err) {
//     console.error("Get member scores error:", err);
//     return res.status(500).json({
//       success: false,
//       msg: "Server error",
//     });
//   }
// };


// export default {
//   createOrganization,
//   getOrganization,
//   updateOrganization,
//   sendInvitation,
//   validateInvitation,
//   acceptInvitation,
//   declineInvitation,
//   removeMember,
//   updateMemberRole,
//   getMembersPerformance,
//   getMemberScores,
// };

// controllers/organizationController.js
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import { createTransport } from "nodemailer";
import crypto from "crypto";
import mongoose from "mongoose";
import InterviewSession from "../models/InterviewSession.js";
import Scorecard from "../models/Scorecard.js";
import { openRouterChat } from "../services/openRouterClient.js";
import { chargeAiCredits } from "../services/creditService.js";

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send bulk invitations
export const sendBulkInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emails } = req.body; // Array of emails

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Please provide an array of email addresses",
      });
    }

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to send invitations",
      });
    }

    const results = {
      success: [],
      failed: [],
      alreadyMember: [],
      alreadyInvited: [],
      invalid: [],
    };

    // Process each email
    for (let email of emails) {
      email = email.trim().toLowerCase();

      // Validate email format
      if (!isValidEmail(email)) {
        results.invalid.push({ email, reason: "Invalid email format" });
        continue;
      }

      // Check if already a member
      const existingMember = organization.members.find(
        (m) => m.email.toLowerCase() === email
      );
      if (existingMember) {
        results.alreadyMember.push({ email, reason: "Already a member" });
        continue;
      }

      // Check if invitation already sent
      const existingInvitation = organization.invitations.find(
        (inv) => inv.email.toLowerCase() === email && inv.status === "pending"
      );
      if (existingInvitation) {
        results.alreadyInvited.push({ email, reason: "Already invited" });
        continue;
      }

      // Check member limit
      const totalPending = organization.invitations.filter(
        (inv) => inv.status === "pending"
      ).length;
      if (
        organization.members.length + totalPending >=
        organization.subscription.maxMembers
      ) {
        results.failed.push({
          email,
          reason: "Member limit reached. Please upgrade your plan.",
        });
        continue;
      }

      try {
        // Generate invitation token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Add invitation
        organization.invitations.push({
          email,
          invitedBy: userId,
          status: "pending",
          token,
          expiresAt,
        });

        // Send email
        const inviteLink = `${process.env.FRONTEND_URL}/org/accept-invite/${token}`;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Invitation to join ${organization.name}`,
          html: `
            <h2>You've been invited to join ${organization.name}</h2>
            <p>Click the link below to accept the invitation:</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
              Accept Invitation
            </a>
            <p>Or copy this link: ${inviteLink}</p>
            <p>This invitation will expire in 7 days.</p>
          `,
        });

        results.success.push({ email, token });
      } catch (error) {
        results.failed.push({ email, reason: error.message });
      }
    }

    // Save all successful invitations
    if (results.success.length > 0) {
      await organization.save();
    }

    res.json({
      success: true,
      msg: `Processed ${emails.length} emails`,
      results: {
        total: emails.length,
        successful: results.success.length,
        failed: results.failed.length,
        alreadyMember: results.alreadyMember.length,
        alreadyInvited: results.alreadyInvited.length,
        invalid: results.invalid.length,
      },
      details: results,
    });
  } catch (err) {
    console.error("Send bulk invitations error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Remove bulk members
export const removeBulkMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberIds } = req.body; // Array of member IDs

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Please provide an array of member IDs",
      });
    }

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to remove members",
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const memberId of memberIds) {
      // Cannot remove owner
      if (memberId === organization.ownerId.toString()) {
        results.failed.push({
          memberId,
          reason: "Cannot remove organization owner",
        });
        continue;
      }

      // Check if member exists
      const memberExists = organization.members.some(
        (m) => m.userId.toString() === memberId
      );

      if (!memberExists) {
        results.failed.push({ memberId, reason: "Member not found" });
        continue;
      }

      try {
        // Remove member from organization
        organization.members = organization.members.filter(
          (m) => m.userId.toString() !== memberId
        );

        // Update user's organization reference
        await User.findByIdAndUpdate(memberId, {
          organizationId: null,
        });

        results.success.push({ memberId });
      } catch (error) {
        results.failed.push({ memberId, reason: error.message });
      }
    }

    // Save organization
    if (results.success.length > 0) {
      await organization.save();
    }

    res.json({
      success: true,
      msg: `Processed ${memberIds.length} members`,
      results: {
        total: memberIds.length,
        removed: results.success.length,
        failed: results.failed.length,
      },
      details: results,
    });
  } catch (err) {
    console.error("Remove bulk members error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Revoke bulk invitations
export const revokeBulkInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emails } = req.body; // Array of emails

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Please provide an array of email addresses",
      });
    }

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to revoke invitations",
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (let email of emails) {
      email = email.trim().toLowerCase();

      const invitation = organization.invitations.find(
        (inv) => inv.email.toLowerCase() === email && inv.status === "pending"
      );

      if (!invitation) {
        results.failed.push({ email, reason: "No pending invitation found" });
        continue;
      }

      invitation.status = "expired";
      results.success.push({ email });
    }

    if (results.success.length > 0) {
      await organization.save();
    }

    res.json({
      success: true,
      msg: `Processed ${emails.length} invitations`,
      results: {
        total: emails.length,
        revoked: results.success.length,
        failed: results.failed.length,
      },
      details: results,
    });
  } catch (err) {
    console.error("Revoke bulk invitations error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Keep all existing functions...
export const validateInvitation = async (req, res) => {
  const { token } = req.params;

  const organization = await Organization.findOne({
    "invitations.token": token,
    "invitations.status": "pending",
  }).select("name invitations");

  if (!organization) {
    return res.status(404).json({
      success: false,
      msg: "Invalid or expired invitation",
    });
  }

  const invitation = organization.invitations.find(
    (inv) => inv.token === token
  );

  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await organization.save();
    return res.status(400).json({
      success: false,
      msg: "Invitation expired",
    });
  }

  res.json({
    success: true,
    organizationName: organization.name,
    email: invitation.email,
  });
};

export const createOrganization = async (req, res) => {
  try {
    const userId = req.user.id;
    let { name, email, description, website, industry, size } = req.body;

    // ── Validate required fields ──────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, msg: "Organization name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, msg: "Organization email is required" });
    }

    // ── Sanitize optional fields (empty string → undefined) ──────
    name        = name.trim();
    email       = email.trim().toLowerCase();
    description = description?.trim() || "";
    website     = website?.trim() || undefined;   // undefined skips URL validation
    industry    = industry?.trim() || undefined;
    size        = size?.trim() || null;            // null is allowed in schema

    // ── Check user already owns an org ───────────────────────────
    const existingOrg = await Organization.findOne({ ownerId: userId });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        msg: "You already own an organization",
      });
    }

    // ── Check email uniqueness (pre-check to give friendly error) ─
    const emailExists = await Organization.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        msg: "An organization with this email already exists",
      });
    }

    // ── Create organization ────────────────────────────────────────
    const organization = await Organization.create({
      name,
      email,
      ownerId: userId,
      description,
      ...(website   ? { website }   : {}),
      ...(industry  ? { industry }  : {}),
      ...(size      ? { size }      : {}),
      members: [],
      invitations: [],
      settings: {
        allowMemberInvites: false,
        requireApprovalForJoin: true,
        autoScheduleInterviews: false,
      },
      subscription: {
        plan: "free",
        maxMembers: 10,
        features: [],
      },
    });

    // ── Update user role ──────────────────────────────────────────
    await User.findByIdAndUpdate(userId, {
      role: "organization",
      organizationId: organization._id,
    });

    return res.json({
      success: true,
      msg: "Organization created successfully",
      organization,
    });
  } catch (err) {
    console.error("Create organization error:", err);

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        msg: `Duplicate value: an organization with that ${field} already exists`,
      });
    }

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, msg: messages });
    }

    return res.status(500).json({ success: false, msg: "Server error creating organization" });
  }
};

export const getOrganization = async (req, res) => {
  try {
    const userId = req.user.id;

    const organization = await Organization.findOne({
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    }).populate("ownerId", "name email");

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Organization not found",
      });
    }

    res.json({
      success: true,
      organization,
    });
  } catch (err) {
    console.error("Get organization error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const organization = await Organization.findOne({ ownerId: userId });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to update this organization",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "website",
      "industry",
      "size",
      "logo",
      "settings",
    ];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (key === "settings") {
          organization.settings = {
            ...organization.settings,
            ...updates.settings,
          };
        } else {
          organization[key] = updates[key];
        }
      }
    });

    await organization.save();

    res.json({
      success: true,
      msg: "Organization updated successfully",
      organization,
    });
  } catch (err) {
    console.error("Update organization error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const sendInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to send invitations",
      });
    }

    const existingMember = organization.members.find((m) => m.email === email);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        msg: "User is already a member",
      });
    }

    const existingInvitation = organization.invitations.find(
      (inv) => inv.email === email && inv.status === "pending"
    );
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        msg: "Invitation already sent to this email",
      });
    }

    if (
      organization.members.length >= organization.subscription.maxMembers
    ) {
      return res.status(400).json({
        success: false,
        msg: "Member limit reached. Please upgrade your plan.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    organization.invitations.push({
      email,
      invitedBy: userId,
      status: "pending",
      token,
      expiresAt,
    });

    await organization.save();

    const inviteLink = `${process.env.FRONTEND_URL}/org/accept-invite/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invitation to join ${organization.name}`,
      html: `
        <h2>You've been invited to join ${organization.name}</h2>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Accept Invitation
        </a>
        <p>Or copy this link: ${inviteLink}</p>
        <p>This invitation will expire in 7 days.</p>
      `,
    });

    res.json({
      success: true,
      msg: "Invitation sent successfully",
    });
  } catch (err) {
    console.error("Send invitation error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    const organization = await Organization.findOne({
      "invitations.token": token,
      "invitations.status": "pending",
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Invalid or expired invitation",
      });
    }

    const invitation = organization.invitations.find(
      (inv) => inv.token === token
    );

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await organization.save();
      return res.status(400).json({
        success: false,
        msg: "Invitation has expired",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    organization.members.push({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });

    invitation.status = "accepted";

    await organization.save();

    user.organizationId = organization._id;
    await user.save();

    res.json({
      success: true,
      msg: "Successfully joined the organization",
      organization,
    });
  } catch (err) {
    console.error("Accept invitation error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const declineInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const organization = await Organization.findOne({
      "invitations.token": token,
      "invitations.status": "pending",
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Invalid invitation",
      });
    }

    const invitation = organization.invitations.find(
      (inv) => inv.token === token
    );

    invitation.status = "declined";
    await organization.save();

    res.json({
      success: true,
      msg: "Invitation declined",
    });
  } catch (err) {
    console.error("Decline invitation error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to remove members",
      });
    }

    if (memberId === organization.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        msg: "Cannot remove organization owner",
      });
    }

    organization.members = organization.members.filter(
      (m) => m.userId.toString() !== memberId
    );

    await organization.save();

    await User.findByIdAndUpdate(memberId, {
      organizationId: null,
    });

    res.json({
      success: true,
      msg: "Member removed successfully",
    });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;
    const { role } = req.body;

    const organization = await Organization.findOne({ ownerId: userId });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owner can update member roles",
      });
    }

    const member = organization.members.find(
      (m) => m.userId.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        msg: "Member not found",
      });
    }

    member.role = role;
    await organization.save();

    res.json({
      success: true,
      msg: "Member role updated successfully",
      member,
    });
  } catch (err) {
    console.error("Update member role error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const getMembersPerformance = async (req, res) => {
  try {
    const userId = req.user.id;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "Organization not found",
      });
    }

    const membersWithPerformance = await Promise.all(
      organization.members.map(async (member) => {
        return {
          ...member.toObject(),
          performance: {
            totalInterviews: 0,
            avgScore: 0,
            recentScores: [],
          },
        };
      })
    );

    res.json({
      success: true,
      members: membersWithPerformance,
    });
  } catch (err) {
    console.error("Get members performance error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const getMemberScores = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid member ID",
      });
    }

    const organization = await Organization.findOne({
      $or: [
        { ownerId: adminUserId },
        { "members.userId": adminUserId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You don't have permission to view member scores",
      });
    }

    const isMember = organization.members.some(
      (m) => m.userId.toString() === memberId
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        msg: "Member not found in organization",
      });
    }

    const scores = await Scorecard.find({ userId: memberId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedScores = scores.map((s) => ({
      id: s._id,
      createdAt: s.createdAt,
      role: s.role || "",
      overallScore: s.scores?.overallScore ?? 0,
      overallBand: s.overallBand || "Not Rated",
      overallMessage: s.overallMessage || "",

      scores: {
        fluency: s.scores?.fluency ?? 0,
        confidence: s.scores?.confidence ?? 0,
        technicalAccuracy: s.scores?.technicalAccuracy ?? 0,
        keywordUsage: s.scores?.keywordUsage ?? 0,
        aiVideoScore: s.scores?.aiVideoScore ?? 0,
        consistencyScore: s.scores?.consistencyScore ?? 0,
      },

      mcqSummary: s.mcqSummary || {
        totalQuestions: 0,
        correct: 0,
        scorePercent: 0,
      },

      codingSummary: s.codingSummary || {
        totalQuestions: 0,
        averageScore: 0,
      },
    }));

    return res.json({
      success: true,
      count: formattedScores.length,
      scores: formattedScores,
    });
  } catch (err) {
    console.error("Get member scores error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

/* ----------------------------------------------------------------
   AI-POWERED CANDIDATE FILTER
   POST /api/organization/filter-candidates
   Body: { criteria: "natural language filter string" }
   Uses Groq to convert criteria → MongoDB conditions, then filters
   org member profiles. Charges 4 credits per call.
---------------------------------------------------------------- */
export const filterCandidates = async (req, res) => {
  try {
    const { criteria } = req.body;
    if (!criteria?.trim()) {
      return res.status(400).json({ success: false, msg: "Criteria is required" });
    }

    // Charge 4 credits
    try {
      await chargeAiCredits(req.user.id, 4);
    } catch (creditErr) {
      return res.status(402).json({ success: false, msg: creditErr.message });
    }

    // Get organization + member userIds
    const org = await Organization.findOne({ ownerId: req.user.id })
      .select("members");
    if (!org) {
      return res.status(404).json({ success: false, msg: "Organization not found" });
    }

    const memberUserIds = org.members
      .filter((m) => m.status === "active")
      .map((m) => m.userId);

    if (memberUserIds.length === 0) {
      return res.json({ success: true, profiles: [], total: 0, criteria });
    }

    // Convert natural language to MongoDB filter via Groq
    const aiPrompt = `Convert this candidate filter criteria to a MongoDB query filter JSON object.
Only use these profile fields: marks10th, marks12th, board10th, board12th, college, graduationYear, skills, role, location, phone.
Use standard MongoDB operators: $gte, $lte, $gt, $lt, $eq, $in, $all, $regex, $options.
Return ONLY a valid JSON object, nothing else.

Examples:
- "12th marks above 90" → {"marks12th": {"$gte": 90}}
- "10th marks between 75 and 90" → {"marks10th": {"$gte": 75, "$lte": 90}}
- "skilled in React and Python" → {"skills": {"$all": ["React", "Python"]}}
- "from CBSE board" → {"board12th": {"$regex": "CBSE", "$options": "i"}}
- "graduated in 2024" → {"graduationYear": {"$regex": "2024"}}

Criteria: "${criteria}"`;

    let mongoFilter = {};
    try {
      const aiResponse = await openRouterChat(
        [{ role: "user", content: aiPrompt }],
        { model: "llama-3.1-8b-instant", json: true }
      );
      if (aiResponse) {
        mongoFilter = JSON.parse(aiResponse);
      }
    } catch (aiErr) {
      console.warn("AI filter parse failed, returning all members:", aiErr.message);
    }

    // Query UserProfile with member userIds + AI-generated conditions
    const profiles = await UserProfile.find({
      userId: { $in: memberUserIds },
      ...mongoFilter,
    }).select(
      "fullName email phone location role bio skills college graduationYear marks10th marks12th board10th board12th socials userId"
    );

    return res.json({
      success: true,
      profiles,
      total: profiles.length,
      criteria,
      appliedFilter: mongoFilter,
    });
  } catch (err) {
    console.error("Filter candidates error:", err);
    return res.status(500).json({ success: false, msg: "Server error: " + err.message });
  }
};

export default {
  createOrganization,
  getOrganization,
  updateOrganization,
  sendInvitation,
  sendBulkInvitations,
  validateInvitation,
  acceptInvitation,
  declineInvitation,
  removeMember,
  removeBulkMembers,
  revokeBulkInvitations,
  updateMemberRole,
  getMembersPerformance,
  getMemberScores,
  filterCandidates,
};