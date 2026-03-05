export const PostSkeleton = () => {
  return (
    <div className="border rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 p-4">
        <div className="size-10 bg-secondary rounded-full"></div>
        <div className="space-y-2">
          <div className="w-32 h-4 bg-secondary rounded"></div>
          <div className="w-20 h-3 bg-secondary rounded"></div>
        </div>
      </div>
      <div className="w-full h-96 bg-secondary"></div>
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <div className="size-6 bg-secondary rounded"></div>
          <div className="size-6 bg-secondary rounded"></div>
          <div className="size-6 bg-secondary rounded"></div>
        </div>
        <div className="w-24 h-4 bg-secondary rounded"></div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-secondary rounded"></div>
          <div className="w-3/4 h-4 bg-secondary rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="size-32 sm:w-40 sm:h-40 bg-secondary rounded-full mx-auto sm:mx-0"></div>
        <div className="flex-1 space-y-6 text-center sm:text-left">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-48 h-8 bg-secondary rounded mx-auto sm:mx-0"></div>
              <div className="w-32 h-10 bg-secondary rounded mx-auto sm:mx-0"></div>
            </div>
            <div className="flex justify-center sm:justify-start gap-8">
              <div className="text-center">
                <div className="w-12 h-6 bg-secondary rounded mb-1"></div>
                <div className="w-8 h-4 bg-secondary rounded"></div>
              </div>
              <div className="text-center">
                <div className="w-12 h-6 bg-secondary rounded mb-1"></div>
                <div className="w-12 h-4 bg-secondary rounded"></div>
              </div>
              <div className="text-center">
                <div className="w-12 h-6 bg-secondary rounded mb-1"></div>
                <div className="w-12 h-4 bg-secondary rounded"></div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-40 h-5 bg-secondary rounded"></div>
            <div className="w-full h-4 bg-secondary rounded"></div>
            <div className="w-3/4 h-4 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserSearchSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
      <div className="flex items-center gap-4 flex-1">
        <div className="size-12 bg-secondary rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="w-32 h-4 bg-secondary rounded"></div>
          <div className="w-24 h-3 bg-secondary rounded"></div>
          <div className="w-48 h-3 bg-secondary rounded"></div>
        </div>
      </div>
      <div className="w-16 h-3 bg-secondary rounded"></div>
    </div>
  );
};

export const NotificationSkeleton = () => {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
      <div className="size-12 bg-secondary rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="w-3/4 h-4 bg-secondary rounded"></div>
        <div className="w-1/2 h-3 bg-secondary rounded"></div>
      </div>
      <div className="size-12 bg-secondary rounded"></div>
    </div>
  );
};
