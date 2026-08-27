// import * as React from "react";
// import Box from "@mui/material/Box";
// import Avatar from "@mui/material/Avatar";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import Divider from "@mui/material/Divider";
// import IconButton from "@mui/material/IconButton";
// import Tooltip from "@mui/material/Tooltip";

// import PersonAdd from "@mui/icons-material/PersonAdd";
// import SettingsIcon from "@mui/icons-material/Settings";
// import LogoutIcon from "@mui/icons-material/Logout";
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import BusinessIcon from "@mui/icons-material/Business";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";

// // SAME helper as ProfilePage (DO NOT CHANGE)
// const getUserFromStorage = () => {
//   try {
//     const stored = localStorage.getItem("user");
//     if (!stored) return null;
//     return JSON.parse(stored);
//   } catch {
//     return null;
//   }
// };

// export default function AccountMenu() {
//   const [anchorEl, setAnchorEl] = React.useState(null);
//   const open = Boolean(anchorEl);
//   const navigate = useNavigate();

//   // State management
//   const [firstLetter, setFirstLetter] = React.useState("U");
//   const [userRole, setUserRole] = React.useState("student");

//   const handleClick = (event) => setAnchorEl(event.currentTarget);
//   const handleClose = () => setAnchorEl(null);

//   // ✅ LOGOUT FUNCTION
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     window.location.href = "/";
//   };

//   // ✅ GET DASHBOARD ROUTE BASED ON ROLE
//   const getDashboardRoute = () => {
//     switch (userRole) {
//       case "organization":
//         return "/org/dashboard";
//       case "admin":
//         return "/admin/dashboard";
//       default:
//         return "/profile";
//     }
//   };

//   // ✅ GET SETTINGS ROUTE BASED ON ROLE
//   const getSettingsRoute = () => {
//     return userRole === "organization" ? "/org/settings" : "/profile/settings";
//   };

//   // --------------------------------------------------
//   // FETCH USER DATA AND ROLE
//   // --------------------------------------------------
//   React.useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const storedUser = getUserFromStorage();
//         const email = storedUser?.email;
//         const role = storedUser?.role || "student";
//         const token = localStorage.getItem("token");

//         // Set role from localStorage
//         setUserRole(role);

//         if (!email || !token) return;

//         // For organization users, use organization name
//         if (role === "organization") {
//           try {
//             const orgRes = await axios.get(
//               "http://localhost:8000/api/organization/me",
//               {
//                 headers: {
//                   Authorization: `Bearer ${token}`,
//                 },
//               }
//             );

//             if (orgRes.data?.success && orgRes.data.organization?.name) {
//               setFirstLetter(
//                 orgRes.data.organization.name.charAt(0).toUpperCase()
//               );
//               return;
//             }
//           } catch (err) {
//             console.log("Organization fetch failed, falling back to user profile");
//           }
//         }

//         // For regular users, fetch profile
//         const res = await axios.get(
//           `http://localhost:8000/api/profile/${encodeURIComponent(email)}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         if (res.data?.success && res.data.profile?.fullName) {
//           setFirstLetter(
//             res.data.profile.fullName.charAt(0).toUpperCase()
//           );
//         } else if (storedUser?.fullName) {
//           setFirstLetter(storedUser.fullName.charAt(0).toUpperCase());
//         }
//       } catch (err) {
//         console.error("Avatar profile fetch failed:", err);
//         // Fallback to user's name from localStorage
//         const storedUser = getUserFromStorage();
//         if (storedUser?.fullName) {
//           setFirstLetter(storedUser.fullName.charAt(0).toUpperCase());
//         }
//       }
//     };

//     fetchProfile();
//   }, []);

//   // -------------------------------
//   // SHARED STYLES
//   // -------------------------------
//   const menuItemSx = {
//     px: 1.5,
//     py: 0.8,
//     borderRadius: 1.5,
//     minWidth: 220,
//     display: "flex",
//     alignItems: "center",
//     gap: 1.25,
//     fontSize: 14,
//   };

//   const listItemIconSx = {
//     minWidth: 36,
//     display: "flex",
//     justifyContent: "center",
//     color: "text.secondary",
//   };

//   return (
//     <>
//       <Box sx={{ display: "flex", alignItems: "center" }}>
//         <Tooltip title="Account settings" arrow>
//           <IconButton
//             onClick={handleClick}
//             size="small"
//             aria-controls={open ? "account-menu" : undefined}
//             aria-haspopup="true"
//             aria-expanded={open ? "true" : undefined}
//             sx={{
//               ml: 2,
//               p: 0.25,
//               borderRadius: "50%",
//               bgcolor: "white",
//               boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//               "&:hover": { bgcolor: "#f7f7fb" },
//             }}
//           >
//             <Avatar
//               sx={{
//                 width: 36,
//                 height: 36,
//                 bgcolor: userRole === "organization" ? "#7c3aed" : "#6366f1",
//                 fontWeight: 600,
//                 fontSize: 15,
//                 boxShadow: `0 2px 6px ${
//                   userRole === "organization"
//                     ? "rgba(124, 58, 237, 0.15)"
//                     : "rgba(99,102,241,0.15)"
//                 }`,
//               }}
//             >
//               {firstLetter}
//             </Avatar>
//           </IconButton>
//         </Tooltip>
//       </Box>

//       <Menu
//         anchorEl={anchorEl}
//         id="account-menu"
//         open={open}
//         onClose={handleClose}
//         onClick={handleClose}
//         PaperProps={{
//           elevation: 6,
//           sx: {
//             mt: 1.5,
//             borderRadius: 2,
//             width: 240,
//             py: 0.5,
//             background: "rgba(255,255,255,0.98)",
//             backdropFilter: "blur(6px)",
//             boxShadow:
//               "0 8px 30px rgba(13, 38, 76, 0.08), 0 1px 0 rgba(255,255,255,0.6) inset",
//             "& .MuiMenuItem-root": {
//               transition: "background 0.18s, transform 0.12s",
//             },
//             "& .MuiMenuItem-root:hover": {
//               backgroundColor: "#f5f6fb",
//             },
//           },
//         }}
//         transformOrigin={{ horizontal: "right", vertical: "top" }}
//         anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
//       >
//         {/* Dashboard - Role-based */}
//         <MenuItem
//           component={Link}
//           to={getDashboardRoute()}
//           sx={menuItemSx}
//           onClick={handleClose}
//         >
//           <ListItemIcon sx={listItemIconSx}>
//             {userRole === "organization" ? (
//               <BusinessIcon fontSize="small" />
//             ) : (
//               <DashboardIcon fontSize="small" />
//             )}
//           </ListItemIcon>
//           <Box component="span" sx={{ color: "text.primary" }}>
//             {userRole === "organization" ? "Organization" : "Dashboard"}
//           </Box>
//         </MenuItem>

//         {/* My account - Only for students */}
//         {userRole === "student" && (
//           <MenuItem
//             component={Link}
//             to="/profile/my-profile"
//             sx={menuItemSx}
//             onClick={handleClose}
//           >
//             <Box sx={listItemIconSx}>
//               <Avatar sx={{ width: 28, height: 28 }} />
//             </Box>
//             <Box component="span" sx={{ color: "text.primary" }}>
//               My account
//             </Box>
//           </MenuItem>
//         )}

//         <Divider sx={{ my: 0.5 }} />

//         {/* Add another account - Only for organizations */}
//         {userRole === "organization" && (
//           <MenuItem
//             component={Link}
//             to="/org/members"
//             sx={menuItemSx}
//             onClick={handleClose}
//           >
//             <ListItemIcon sx={listItemIconSx}>
//               <PersonAdd fontSize="small" />
//             </ListItemIcon>
//             <Box component="span" sx={{ color: "text.primary" }}>
//               Manage Members
//             </Box>
//           </MenuItem>
//         )}

//         {/* Settings - Role-based */}
//         <MenuItem
//           component={Link}
//           to={getSettingsRoute()}
//           sx={menuItemSx}
//           onClick={handleClose}
//         >
//           <ListItemIcon sx={listItemIconSx}>
//             <SettingsIcon fontSize="small" />
//           </ListItemIcon>
//           <Box component="span" sx={{ color: "text.primary" }}>
//             Settings
//           </Box>
//         </MenuItem>

//         {/* Logout */}
//         <MenuItem
//           sx={menuItemSx}
//           onClick={() => {
//             handleClose();
//             handleLogout();
//           }}
//         >
//           <ListItemIcon sx={{ ...listItemIconSx, color: "error.main" }}>
//             <LogoutIcon fontSize="small" />
//           </ListItemIcon>
//           <Box component="span" sx={{ color: "text.primary" }}>
//             Logout
//           </Box>
//         </MenuItem>
//       </Menu>
//     </>
//   );
// }
import * as React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import PersonAdd from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Helper to get user from storage
const getUserFromStorage = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export default function AccountMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  // State management
  const [firstLetter, setFirstLetter] = React.useState("U");
  const [userRole, setUserRole] = React.useState("student");
  const [hasProfile, setHasProfile] = React.useState(false);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Get dashboard route based on role and profile status
  const getDashboardRoute = () => {
    switch (userRole) {
      case "organization":
        return "/org/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        // For students, check if they have a profile
        return hasProfile ? "/profile" : "/profile/create";
    }
  };

  // Handle dashboard click with profile check
  const handleDashboardClick = (e) => {
    e.preventDefault();
    handleClose();
    const route = getDashboardRoute();
    navigate(route);
  };

  // Get settings route based on role
  const getSettingsRoute = () => {
    return userRole === "organization" ? "/org/settings" : "/profile/settings";
  };

  // Fetch user data and check profile status
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = getUserFromStorage();
        const email = storedUser?.email;
        const role = storedUser?.role || "student";
        const token = localStorage.getItem("token");

        // Set role from localStorage
        setUserRole(role);

        if (!email || !token) return;

        // For organization users, use organization name
        if (role === "organization") {
          try {
            const orgRes = await axios.get(
              "http://localhost:8000/api/organization/me",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (orgRes.data?.success && orgRes.data.organization?.name) {
              setFirstLetter(
                orgRes.data.organization.name.charAt(0).toUpperCase()
              );
              setHasProfile(true); // Organizations always "have profile"
              return;
            }
          } catch (err) {
            console.log("Organization fetch failed, falling back to user profile");
          }
        }

        // For regular users, fetch profile
        try {
          const res = await axios.get(
            `http://localhost:8000/api/profile/${encodeURIComponent(email)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.data?.success && res.data.profile?.fullName) {
            setFirstLetter(
              res.data.profile.fullName.charAt(0).toUpperCase()
            );
            setHasProfile(true); // Profile exists
          } else {
            setHasProfile(false); // No profile
            // Still set first letter from stored user name if available
            if (storedUser?.fullName) {
              setFirstLetter(storedUser.fullName.charAt(0).toUpperCase());
            }
          }
        } catch (err) {
          console.log("Profile fetch failed:", err);
          setHasProfile(false); // No profile found
          // Fallback to user's name from localStorage
          if (storedUser?.fullName) {
            setFirstLetter(storedUser.fullName.charAt(0).toUpperCase());
          }
        }
      } catch (err) {
        console.error("Avatar profile fetch failed:", err);
        setHasProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Shared styles
  const menuItemSx = {
    px: 1.5,
    py: 0.8,
    borderRadius: 1.5,
    minWidth: 220,
    display: "flex",
    alignItems: "center",
    gap: 1.25,
    fontSize: 14,
  };

  const listItemIconSx = {
    minWidth: 36,
    display: "flex",
    justifyContent: "center",
    color: "text.secondary",
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip title="Account settings" arrow>
          <IconButton
            onClick={handleClick}
            size="small"
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            sx={{
              ml: 2,
              p: 0.25,
              borderRadius: "50%",
              bgcolor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              "&:hover": { bgcolor: "#f7f7fb" },
            }}
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: userRole === "organization" ? "#7c3aed" : "#6366f1",
                fontWeight: 600,
                fontSize: 12,
                boxShadow: `0 2px 6px ${
                  userRole === "organization"
                    ? "rgba(124, 58, 237, 0.15)"
                    : "rgba(99,102,241,0.15)"
                }`,
              }}
            >
              {firstLetter}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 6,
          sx: {
            mt: 1.5,
            borderRadius: 2,
            width: 240,
            py: 0.5,
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(6px)",
            boxShadow:
              "0 8px 30px rgba(13, 38, 76, 0.08), 0 1px 0 rgba(255,255,255,0.6) inset",
            "& .MuiMenuItem-root": {
              transition: "background 0.18s, transform 0.12s",
            },
            "& .MuiMenuItem-root:hover": {
              backgroundColor: "#f5f6fb",
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* Dashboard - Role-based with profile check */}
        <MenuItem
          onClick={handleDashboardClick}
          sx={menuItemSx}
        >
          <ListItemIcon sx={listItemIconSx}>
            {userRole === "organization" ? (
              <BusinessIcon fontSize="small" />
            ) : (
              <DashboardIcon fontSize="small" />
            )}
          </ListItemIcon>
          <Box component="span" sx={{ color: "text.primary" }}>
            {userRole === "organization" 
              ? "Organization" 
              : hasProfile 
                ? "Dashboard" 
                : "Create Profile"}
          </Box>
        </MenuItem>

        {/* My account - Only for students with profile */}
        {userRole === "student" && hasProfile && (
          <MenuItem
            component={Link}
            to="/profile/my-profile"
            sx={menuItemSx}
            onClick={handleClose}
          >
            <Box sx={listItemIconSx}>
              <Avatar sx={{ width: 28, height: 28 }} />
            </Box>
            <Box component="span" sx={{ color: "text.primary" }}>
              My account
            </Box>
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />

        {/* Add another account - Only for organizations */}
        {userRole === "organization" && (
          <MenuItem
            component={Link}
            to="/org/members"
            sx={menuItemSx}
            onClick={handleClose}
          >
            <ListItemIcon sx={listItemIconSx}>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            <Box component="span" sx={{ color: "text.primary" }}>
              Manage Members
            </Box>
          </MenuItem>
        )}

        {/* Settings - Role-based, only if profile exists for students */}
        {(userRole !== "student" || hasProfile) && (
          <MenuItem
            component={Link}
            to={getSettingsRoute()}
            sx={menuItemSx}
            onClick={handleClose}
          >
            <ListItemIcon sx={listItemIconSx}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <Box component="span" sx={{ color: "text.primary" }}>
              Settings
            </Box>
          </MenuItem>
        )}

        {/* Logout */}
        <MenuItem
          sx={menuItemSx}
          onClick={() => {
            handleClose();
            handleLogout();
          }}
        >
          <ListItemIcon sx={{ ...listItemIconSx, color: "error.main" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Box component="span" sx={{ color: "text.primary" }}>
            Logout
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}