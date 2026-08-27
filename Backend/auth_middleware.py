# auth_middleware.py
from flask import request, jsonify
from functools import wraps
import jwt
import os
from datetime import datetime

# This should match your Node.js JWT_SECRET
JWT_SECRET = os.getenv("JWT_SECRET")

def is_login_required(f):
    """
    Decorator to protect Flask routes with JWT authentication.
    Validates token and attaches user data to request.
    
    Usage:
        @app.route("/protected")
        @is_login_required
        def protected_route():
            user = request.user  # Access authenticated user data
            return jsonify({"user": user})
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get authorization header
            auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
            
            if not auth_header:
                return jsonify({
                    "success": False,
                    "msg": "No token provided, authorization denied"
                }), 401
            
            # Check if Bearer token format
            if not auth_header.startswith("Bearer "):
                return jsonify({
                    "success": False,
                    "msg": "Invalid token format. Expected 'Bearer <token>'"
                }), 401
            
            # Extract token
            token = auth_header.split(" ")[1]
            
            if not token:
                return jsonify({
                    "success": False,
                    "msg": "No token provided, authorization denied"
                }), 401
            
            # Check if JWT_SECRET is configured
            if not JWT_SECRET :
                print("ERROR: JWT_SECRET is not properly configured!")
                return jsonify({
                    "success": False,
                    "msg": "Server configuration error"
                }), 500
            
            # Verify and decode token
            try:
                decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                
                # Attach user data to request object
                request.user = {
                    "id": decoded.get("id"),
                    "email": decoded.get("email"),
                    "role": decoded.get("role", "student"),
                }
                
                # Also store raw decoded data
                request.decoded_token = decoded
                
            except jwt.ExpiredSignatureError:
                return jsonify({
                    "success": False,
                    "msg": "Token expired, please login again"
                }), 401
            
            except jwt.InvalidTokenError as e:
                print(f"Invalid token error: {e}")
                return jsonify({
                    "success": False,
                    "msg": "Invalid token"
                }), 401
            
            # Call the actual route function
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return jsonify({
                "success": False,
                "msg": "Authentication failed"
            }), 401
    
    return decorated_function


def require_role(allowed_roles):
    """
    Decorator to restrict access based on user role.
    Must be used AFTER @is_login_required
    
    Args:
        allowed_roles: String or list of allowed roles
    
    Usage:
        @app.route("/organization-only")
        @is_login_required
        @require_role("organization")
        def org_route():
            return jsonify({"msg": "Organization access"})
        
        @app.route("/admin-or-org")
        @is_login_required
        @require_role(["admin", "organization"])
        def admin_org_route():
            return jsonify({"msg": "Admin or Org access"})
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Check if user data exists (from @is_login_required)
                if not hasattr(request, 'user'):
                    return jsonify({
                        "success": False,
                        "msg": "Authentication required. Use @is_login_required first."
                    }), 401
                
                user_role = request.user.get("role", "student")
                
                # Convert single role to list for consistency
                roles_list = [allowed_roles] if isinstance(allowed_roles, str) else allowed_roles
                
                # Check if user's role is in allowed roles
                if user_role not in roles_list:
                    return jsonify({
                        "success": False,
                        "msg": f"Access denied. Required role: {' or '.join(roles_list)}"
                    }), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                print(f"Role authorization error: {e}")
                return jsonify({
                    "success": False,
                    "msg": "Authorization check failed"
                }), 500
        
        return decorated_function
    return decorator


def is_organization(f):
    """
    Decorator to allow only organization users.
    Shorthand for @require_role("organization")
    
    Usage:
        @app.route("/org-dashboard")
        @is_login_required
        @is_organization
        def org_dashboard():
            return jsonify({"msg": "Organization dashboard"})
    """
    return require_role("organization")(f)


def is_admin(f):
    """
    Decorator to allow only admin users.
    Shorthand for @require_role("admin")
    
    Usage:
        @app.route("/admin-panel")
        @is_login_required
        @is_admin
        def admin_panel():
            return jsonify({"msg": "Admin panel"})
    """
    return require_role("admin")(f)


def is_student(f):
    """
    Decorator to allow only student users.
    Shorthand for @require_role("student")
    
    Usage:
        @app.route("/student-profile")
        @is_login_required
        @is_student
        def student_profile():
            return jsonify({"msg": "Student profile"})
    """
    return require_role("student")(f)


def optional_auth(f):
    """
    Decorator for routes that work with or without authentication.
    If token is present and valid, adds user data to request.
    If token is missing or invalid, continues without user data.
    
    Usage:
        @app.route("/public-content")
        @optional_auth
        def public_content():
            if hasattr(request, 'user'):
                return jsonify({"msg": "Authenticated", "user": request.user})
            else:
                return jsonify({"msg": "Public access"})
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
            
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
                if token and JWT_SECRET:
                    try:
                        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                        request.user = {
                            "id": decoded.get("id"),
                            "email": decoded.get("email"),
                            "role": decoded.get("role", "student"),
                        }
                    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                        pass  # Continue without user data
            
        except Exception:
            pass  # Continue without user data
        
        return f(*args, **kwargs)
    
    return decorated_function