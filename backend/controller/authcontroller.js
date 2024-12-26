export const sharePromise = async (req, res) => {
    const { promiseTitleId } = req.params;

    try {
        const user = await User.findOne({ "promiseTitle._id": promiseTitleId });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Find the promise title by its ID
        const promise = user.promiseTitle.id(promiseTitleId);

        if (!promise) {
            return res.status(404).json({ message: "Promise not found." });
        }

        // Generate a unique share token
        const shareToken = uuidv4(); // Generate a unique token for the shareable link

        // Save the share token to the promise title
        promise.shareToken = shareToken;
        await user.save(); // Save the updated user document with the share token

        // Construct the shareable link
        const shareLink = `http://localhost:5174/promise/${shareToken}`;

        // Return the shareable link as part of the response
        return res.status(200).json({
            success: true,
            message: "Shareable link generated successfully.",
            shareLink: shareLink, // Send the generated link to the client
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error. Could not generate shareable link." });
    }
};