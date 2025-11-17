const Footer = () => {
  return (
    <footer className="bg-black border-t border-border/50 mt-12">
      <div className="flex flex-col justify-center items-center gap-2 max-w-7xl mx-auto px-4 py-8 md:px-8">
        <div className="flex gap-3">
          <p>Powered by: </p>
          <div>
            <img
              src="/lucentlabs logo.png"
              alt="lucentlabs Logo"
              width={24}
              height={24}
            />
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
            Lucent Labs
          </h3>
        </div>

        <p className="text-center text-muted-foreground text-sm">
          © 2025 HydraStake. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
export default Footer;
