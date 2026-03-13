function SkeletonCard() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl bg-gray-200 overflow-hidden mb-10">
      <div className="p-8 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
              <div className="w-1/2 h-10 bg-gray-300 rounded"></div>
          </div>
          <div>
              <div className="w-3/4 h-8 bg-gray-300 rounded mb-4"></div>
              <div className="flex justify-between items-end">
                  <div className="w-1/2">
                      <div className="w-1/4 h-3 bg-gray-300 rounded mb-1.5"></div>
                      <div className="w-full h-5 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-1/4 text-right">
                      <div className="w-1/2 h-3 bg-gray-300 rounded mb-1.5 ml-auto"></div>
                      <div className="w-full h-5 bg-gray-300 rounded"></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#fffdf7] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#a7dff4] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 animate-pulse">
        <div className="text-center mb-10">
            <div className="h-9 bg-gray-300 rounded-lg w-3/4 mx-auto mb-3"></div>
            <div className="h-5 bg-gray-300 rounded-lg w-1/2 mx-auto"></div>
        </div>
        
        <SkeletonCard />

        <div className="bg-white/50 p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
            <div className="space-y-4">
                <div>
                    <div className="h-4 bg-gray-300 rounded-lg w-1/4 mb-2 ml-1"></div>
                    <div className="h-16 bg-gray-200 rounded-2xl w-full"></div>
                </div>
                <div className="h-14 bg-gray-300 rounded-full w-full !mt-6"></div>
            </div>
        </div>
      </div>
    </main>
  );
}