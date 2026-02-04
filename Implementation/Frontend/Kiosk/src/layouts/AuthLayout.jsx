function AuthLayout({ children }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Content container */}
      {children}
    </div>
  );
}

export default AuthLayout;

