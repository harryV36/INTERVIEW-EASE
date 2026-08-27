// controllers/taskController.js
import Task from "../models/Task.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import crypto from "crypto";
import { createTransport } from "nodemailer";
import { chargeOrgCredits, getOrgCredits } from "../services/creditService.js";

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ============================================================
   CREATE TASK  — costs 1 org credit per task
============================================================ */
export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      assignedToIds,
      dueDate,
      priority,
      type,
      interviewSetup,
      customFields,
    } = req.body;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({ success: false, msg: "You don't have permission to create tasks" });
    }

    if (!assignedToIds || assignedToIds.length === 0) {
      return res.status(400).json({ success: false, msg: "Please assign at least one member" });
    }

    // ── Charge 1 org credit per task creation ────────────────────────────
    try {
      await chargeOrgCredits(organization._id, "create_task");
    } catch (creditErr) {
      return res.status(402).json({
        success: false,
        msg: creditErr.message,
        orgCredits: await getOrgCredits(organization._id),
      });
    }

    const assignedToData = [];
    for (const memberId of assignedToIds) {
      const member = organization.members.find((m) => m.userId.toString() === memberId);
      if (!member) {
        return res.status(400).json({ success: false, msg: `User ${memberId} is not a member of the organization` });
      }
      const accessToken = crypto.randomBytes(32).toString("hex");
      const taskLink = `${process.env.FRONTEND_URL}/task/${accessToken}`;
      assignedToData.push({
        userId: member.userId,
        email: member.email,
        name: member.name,
        status: "pending",
        accessToken,
        taskLink,
      });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo: assignedToData,
      assignedBy: userId,
      organizationId: organization._id,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
      type: type || "interview",
      interviewSetup,
      customFields: customFields || [],
      overallStatus: "pending",
    });

    // Send email to each assignee
    const emailPromises = assignedToData.map((assignee) =>
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: assignee.email,
        subject: `New Task Assigned: ${title}`,
        html: `
          <h2>You have been assigned a new task</h2>
          <h3>${title}</h3>
          <p>${description || "No description provided"}</p>
          ${interviewSetup ? `
          <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0">
            <h4>Interview Setup:</h4>
            <ul>
              <li>Role: ${interviewSetup.targetJobRole}</li>
              <li>Duration: ${interviewSetup.duration} minutes</li>
              <li>Questions: ${interviewSetup.numberOfQuestions}</li>
              <li>Difficulty: ${interviewSetup.difficulty}</li>
            </ul>
          </div>` : ""}
          <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : "No deadline"}</p>
          <p><strong>Priority:</strong> ${priority || "Medium"}</p>
          <a href="${assignee.taskLink}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:white;text-decoration:none;border-radius:8px;margin:16px 0">
            Start Task
          </a>
        `,
      }).catch((e) => console.warn("Email failed for", assignee.email, e.message))
    );

    await Promise.all(emailPromises);

    return res.json({
      success: true,
      msg: "Task created and assigned successfully",
      task,
      assignedCount: assignedToData.length,
      orgCreditsRemaining: (organization.credits?.balance ?? 0) - 1,
    });
  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ success: false, msg: "Failed to create task" });
  }
};

/* ============================================================
   GET ALL TASKS (ADMIN)
============================================================ */
export const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority } = req.query;

    const organization = await Organization.findOne({
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.role": "admin" },
      ],
    });

    if (!organization) {
      return res.status(403).json({ success: false, msg: "You don't have permission to view tasks" });
    }

    const filter = { organizationId: organization._id };
    if (status && status !== "all")     filter.overallStatus = status;
    if (priority && priority !== "all") filter.priority      = priority;

    const tasks = await Task.find(filter)
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, tasks, orgCredits: organization.credits?.balance ?? 0 });
  } catch (err) {
    console.error("Get all tasks error:", err);
    return res.status(500).json({ success: false, msg: "Failed to fetch tasks" });
  }
};

/* ============================================================
   GET MY TASKS (MEMBER)
============================================================ */
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({ "assignedTo.userId": userId })
      .populate("organizationId", "name")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    const myTasks = tasks.map((task) => {
      const myAssignment = task.assignedTo.find((a) => a.userId.toString() === userId);
      return {
        ...task.toObject(),
        status:            myAssignment.status,
        sessionId:         myAssignment.sessionId,
        scorecardId:       myAssignment.scorecardId,
        completionScore:   myAssignment.completionScore,
        myStatus:          myAssignment.status,
        myAccessToken:     myAssignment.accessToken,
        myTaskLink:        myAssignment.taskLink,
        mySessionId:       myAssignment.sessionId,
        myScorecardId:     myAssignment.scorecardId,
        myCompletionScore: myAssignment.completionScore,
        myStartedAt:       myAssignment.startedAt,
        myCompletedAt:     myAssignment.completedAt,
      };
    });

    return res.json({ success: true, tasks: myTasks });
  } catch (err) {
    console.error("Get my tasks error:", err);
    return res.status(500).json({ success: false, msg: "Failed to fetch tasks" });
  }
};

/* ============================================================
   GET TASK BY TOKEN
============================================================ */
export const getTaskByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const task = await Task.findOne({ "assignedTo.accessToken": token })
      .populate("organizationId", "name")
      .populate("assignedBy", "name email");

    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    const assignment = task.assignedTo.find((a) => a.accessToken === token);
    const expired = task.dueDate && new Date(task.dueDate) < new Date();

    return res.json({
      success: true,
      task: {
        ...task.toObject(),
        status: assignment.status,
        userStatus: assignment.status,
        sessionId: assignment.sessionId,
        scorecardId: assignment.scorecardId,
        completionScore: assignment.completionScore,
      },
      expired,
    });
  } catch (err) {
    console.error("Get task by token error:", err);
    return res.status(500).json({ success: false, msg: "Failed to fetch task" });
  }
};

/* ============================================================
   START / COMPLETE TASK
============================================================ */
export const startTaskInterview = async (req, res) => {
  try {
    const { token } = req.params;
    const { sessionId } = req.body;

    const task = await Task.findOne({ "assignedTo.accessToken": token });
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    const assignment = task.assignedTo.find((a) => a.accessToken === token);
    if (assignment.status !== "pending") {
      return res.status(400).json({ success: false, msg: "Task already started or completed" });
    }

    assignment.status    = "in-progress";
    assignment.sessionId = sessionId;
    assignment.startedAt = new Date();
    await task.save();

    return res.json({ success: true, msg: "Task started" });
  } catch (err) {
    console.error("Start task error:", err);
    return res.status(500).json({ success: false, msg: "Failed to start task" });
  }
};

export const completeTaskInterview = async (req, res) => {
  try {
    const { token } = req.params;
    const { scorecardId, score } = req.body;

    const task = await Task.findOne({ "assignedTo.accessToken": token });
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    const assignment = task.assignedTo.find((a) => a.accessToken === token);
    assignment.status          = "completed";
    assignment.scorecardId     = scorecardId;
    assignment.completionScore = score;
    assignment.completedAt     = new Date();
    await task.save();

    return res.json({ success: true, msg: "Task completed" });
  } catch (err) {
    console.error("Complete task error:", err);
    return res.status(500).json({ success: false, msg: "Failed to complete task" });
  }
};

/* ============================================================
   UPDATE / DELETE / COMMENT
============================================================ */
export const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { status } = req.body;

    const organization = await Organization.findOne({
      $or: [{ ownerId: userId }, { "members.userId": userId, "members.role": "admin" }],
    });
    if (!organization) return res.status(403).json({ success: false, msg: "No permission" });

    const task = await Task.findOne({ _id: taskId, organizationId: organization._id });
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    task.overallStatus = status;
    await task.save();

    return res.json({ success: true, msg: "Task updated", task });
  } catch (err) {
    console.error("Update task error:", err);
    return res.status(500).json({ success: false, msg: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const organization = await Organization.findOne({
      $or: [{ ownerId: userId }, { "members.userId": userId, "members.role": "admin" }],
    });
    if (!organization) return res.status(403).json({ success: false, msg: "No permission" });

    const task = await Task.findOneAndDelete({ _id: taskId, organizationId: organization._id });
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    return res.json({ success: true, msg: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ success: false, msg: "Failed to delete task" });
  }
};

export const addTaskComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    task.comments.push({ userId, text, createdAt: new Date() });
    await task.save();

    return res.json({ success: true, msg: "Comment added", task });
  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ success: false, msg: "Failed to add comment" });
  }
};

export default {
  createTask,
  getAllTasks,
  getMyTasks,
  getTaskByToken,
  startTaskInterview,
  completeTaskInterview,
  updateTask,
  deleteTask,
  addTaskComment,
};
