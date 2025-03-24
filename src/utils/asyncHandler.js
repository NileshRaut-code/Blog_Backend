const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next))
    .catch((err) => res.status(err.statusCode || 500).json({
      success: false,
      statusCode:err.statusCode,
      message: err.message || "Internal Server Error",
    }));
  };
};

export { asyncHandler };
