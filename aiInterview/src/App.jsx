// import "./App.css";
// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import UserLayout from "./components/Layouts/UserLayout";
// import HeroSection from "./components/custom/Hero";
// import StartInterview from "./startinterview/StartInterview";
// import UnifiedVideoSection from "./interviewbegin/Structure2";
// import Login from "./components/signin/Login";
// import Signup from "./components/signin/Signup";
// import UserProfile from "./components/ProfilePages/UserProfile";
// import ProfilePage from "./components/ProfilePages/ProfilePage";
// import ScoresPage from "./components/ProfilePages/ScoresPage";
// import InterviewsPage from "./components/ProfilePages/InterviewsPage";
// import ExploreJobs from "./components/ProfilePages/ExploreJobs";
// import Settings from "./components/ProfilePages/Settings";
// import ProfileLayout from "./components/Layouts/ProfileLayout";
// import ProfileForm from "./components/custom/ProfileForm";
// import InterviewSetup from "./components/interviewQuestion/InterviewSetup";
// import InterviewQuestionsPage from "./components/interviewQuestion/InterviewQuestionsPage";
// import ScorecardPage from "./components/interviewQuestion/ScorecardPage";
// import PdfEditor from "./startinterview/components/page/PdfEditor";
// import ProtectedRoute from "./components/auth/ProtectedRoute";

// // ⭐ NEW: Organization Components
// import OrgLayout from "./components/Organization/OrgLayout";
// import OrgDashboard from "./components/Organization/OrgDashboard";
// import MembersPage from "./components/Organization/MembersPage";
// import SchedulePage from "./components/Organization/SchedulePage";
// import TasksPage from "./components/Organization/TasksPage";
// import OrgSettings from "./components/Organization/OrgSettings";
// import CreateOrgPage from "./components/Organization/CreateOrgPage";
// import AcceptInvitePage from "./components/Organization/AcceptInvitePage";
// // Add to imports
// import RealTimeInterview from "./interviewbegin/RealTimeInterview";

// function App() {
//   return (
//     <div>
//       <BrowserRouter>
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<UserLayout />}>
//             <Route index element={<HeroSection />} />
//             <Route path="/feature-individual" />
//             <Route
//               path="/feature-individual-student"
//               element={<StartInterview />}
//             />
//             <Route
//               path="/feature-individual-jobseeker"
//               element={<InterviewSetup />}
//             />

//             <Route
//               path="/interview/realtime/:sessionId"
//               element={<RealTimeInterview />}
//             />
//           </Route>

//           {/* Interview Routes */}
//           <Route
//             path="/feature-individual-student/lets-start/interview-begin"
//             element={<UnifiedVideoSection />}
//           />
//           <Route
//             path="/interview/:sessionId"
//             element={<InterviewQuestionsPage />}
//           />
//           <Route path="/scorecard/:scorecardId" element={<ScorecardPage />} />

//           {/* Auth Routes */}
//           <Route path="/home/login" element={<Login />} />
//           <Route path="/home/signup" element={<Signup />} />
//           <Route path="/profile/create" element={<ProfileForm />} />
//           <Route path="/pdf-editor" element={<PdfEditor />} />

//           {/* Student Profile Routes */}
//           <Route path="/profile" element={<ProfileLayout />}>
//             <Route index element={<UserProfile />} />
//             <Route path="my-profile" element={<ProfilePage />} />
//             <Route path="scores" element={<ScoresPage />} />
//             <Route path="interviews" element={<InterviewsPage />} />
//             <Route path="jobs" element={<ExploreJobs />} />
//             <Route path="settings" element={<Settings />} />
//           </Route>

//           {/* ⭐ NEW: Organization Routes */}
//           <Route
//             path="/org/create"
//             element={<ProtectedRoute element={<CreateOrgPage />} />}
//           />

//           <Route
//             path="/org/accept-invite/:token"
//             element={<AcceptInvitePage />}
//           />

//           <Route
//             path="/org"
//             element={
//               <ProtectedRoute
//                 requiredRole="organization"
//                 element={<OrgLayout />}
//               />
//             }
//           >
//             <Route index element={<OrgDashboard />} />
//             <Route path="dashboard" element={<OrgDashboard />} />
//             <Route path="members" element={<MembersPage />} />
//             <Route path="schedule" element={<SchedulePage />} />
//             <Route path="tasks" element={<TasksPage />} />
//             <Route path="settings" element={<OrgSettings />} />
//           </Route>
//         </Routes>
//       </BrowserRouter>
//     </div>
//   );
// }

// export default App;



import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import UserLayout from "./components/Layouts/UserLayout";
import HeroSection from "./components/custom/Hero";
import StartInterview from "./startinterview/StartInterview";
import UnifiedVideoSection from "./interviewbegin/Structure2";
import Scorecard from "./interviewbegin/Scorecard";
import Login from "./components/signin/Login";
import Signup from "./components/signin/Signup";
import ResetPassword from "./components/signin/ResetPassword";
import UserProfile from "./components/ProfilePages/UserProfile";
import ProfilePage from "./components/ProfilePages/ProfilePage";
import ScoresPage from "./components/ProfilePages/ScoresPage";
import InterviewsPage from "./components/ProfilePages/InterviewsPage";
import ExploreJobs from "./components/ProfilePages/ExploreJobs";
import Settings from "./components/ProfilePages/Settings";
import ProfileLayout from "./components/Layouts/ProfileLayout";
import ProfileForm from "./components/custom/ProfileForm";
import InterviewSetup from "./components/interviewQuestion/InterviewSetup";
import InterviewQuestionsPage from "./components/interviewQuestion/InterviewQuestionsPage";
import ScorecardPage from "./components/interviewQuestion/ScorecardPage";
import PdfEditor from "./startinterview/components/page/PdfEditor";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Organization Components
import OrgLayout from "./components/Organization/OrgLayout";
import OrgDashboard from "./components/Organization/OrgDashboard";
import MembersPage from "./components/Organization/MembersPage";
import SchedulePage from "./components/Organization/SchedulePage";
import TasksPage from "./components/Organization/TasksPage";
import OrgSettings from "./components/Organization/OrgSettings";
import CreateOrgPage from "./components/Organization/CreateOrgPage";
import AcceptInvitePage from "./components/Organization/AcceptInvitePage";
import MemberScoresPage from "./components/Organization/MemberScoresPage";
import OrgCandidateFilter from "./components/Organization/OrgCandidateFilter";

// Pricing page
import PricingPage from "./components/custom/PricingPage";

// Student Task Components
import StudentTaskViewer from "./components/ProfilePages/StudentTaskViewer"; // ⭐ NEW
import TaskExecutionPage from "./components/ProfilePages/TaskExecutionPage"; // ⭐ NEW

// Real-time Interview
// import RealTimeInterview from "./interviewbegin/RealTimeInterview";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<HeroSection />} />
            <Route path="/feature-individual" />
            <Route
              path="/feature-individual-student"
              element={<StartInterview />}
            />
            <Route
              path="/feature-individual-jobseeker"
              element={<InterviewSetup />}
            />

            {/* <Route
              path="/interview/realtime/:sessionId"
              element={<RealTimeInterview />}
            /> */}
          </Route>

          {/* Interview Routes */}
          <Route
            path="/feature-individual-student/lets-start/interview-begin"
            element={<UnifiedVideoSection />}
          />
          <Route 
            path="/feature-individual-student/lets-start/scorecard"
            element={<Scorecard />}
          />
        
          <Route
            path="/interview/:sessionId"
            element={<InterviewQuestionsPage />}
          />
          <Route path="/scorecard/:scorecardId" element={<ScorecardPage />} />

          {/* Pricing page */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* Auth Routes */}
          <Route path="/home/login" element={<Login />} />
          <Route path="/home/signup" element={<Signup />} />
          <Route path="/home/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile/create" element={<ProfileForm />} />
          <Route path="/pdf-editor" element={<PdfEditor />} />

          {/* ⭐ NEW: Public Task Execution (No Auth Required) */}
          <Route path="/task/:token" element={<TaskExecutionPage />} />

          {/* Student Profile Routes */}
          <Route path="/profile" element={<ProfileLayout />}>
            <Route index element={<UserProfile />} />
            <Route path="my-profile" element={<ProfilePage />} />
            <Route path="scores" element={<ScoresPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="tasks" element={<StudentTaskViewer />} /> {/* ⭐ NEW */}
            <Route path="jobs" element={<ExploreJobs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Organization Routes */}
          <Route
            path="/org/create"
            element={<ProtectedRoute element={<CreateOrgPage />} />}
          />

          <Route
            path="/org/accept-invite/:token"
            element={<AcceptInvitePage />}
          />

          <Route
            path="/org"
            element={
              <ProtectedRoute
                requiredRole="organization"
                element={<OrgLayout />}
              />
            }
          >
            <Route index element={<OrgDashboard />} />
            <Route path="dashboard" element={<OrgDashboard />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="scores" element={<MemberScoresPage />} />
            <Route path="candidates" element={<OrgCandidateFilter />} />
            <Route path="settings" element={<OrgSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
