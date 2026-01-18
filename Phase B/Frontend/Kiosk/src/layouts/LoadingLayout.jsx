function LoadingLayout({ children }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white">
      {children}
    </div>
  );
}

export default LoadingLayout;

