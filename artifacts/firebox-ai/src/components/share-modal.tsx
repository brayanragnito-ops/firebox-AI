import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Share2, Globe, Users, Copy, Check, X } from "lucide-react";

interface ShareModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  visibility?: "private" | "shared" | "public";
}

export default function ShareModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  visibility = "private",
}: ShareModalProps) {
  const [shareMode, setShareMode] = useState<"private" | "shared" | "public">(visibility);
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/projects/${projectId}`;

  const handleAddEmail = () => {
    if (newEmail.trim() && !sharedEmails.includes(newEmail)) {
      setSharedEmails([...sharedEmails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setSharedEmails(sharedEmails.filter((e) => e !== email));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    // Call API to update project sharing
    console.log({
      projectId,
      visibility: shareMode,
      sharedWith: sharedEmails,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Share2 size={20} />
            Share "{projectName}"
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Mode Selection */}
          <div>
            <label className="block text-sm font-semibold mb-3">Share Mode</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shareMode"
                  value="private"
                  checked={shareMode === "private"}
                  onChange={(e) => setShareMode(e.target.value as any)}
                />
                <div>
                  <div className="font-medium text-sm">Private</div>
                  <div className="text-xs text-gray-600">Only you can access</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shareMode"
                  value="shared"
                  checked={shareMode === "shared"}
                  onChange={(e) => setShareMode(e.target.value as any)}
                />
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Users size={16} />
                    Shared
                  </div>
                  <div className="text-xs text-gray-600">Share with specific people</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shareMode"
                  value="public"
                  checked={shareMode === "public"}
                  onChange={(e) => setShareMode(e.target.value as any)}
                />
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Globe size={16} />
                    Public
                  </div>
                  <div className="text-xs text-gray-600">Anyone with link can access</div>
                </div>
              </label>
            </div>
          </div>

          {/* Shared/Public Options */}
          {(shareMode === "shared" || shareMode === "public") && (
            <div>
              {shareMode === "public" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Public Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    />
                    <Button onClick={handleCopyLink} size="sm" variant="outline">
                      {copied ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {shareMode === "shared" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Share With</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                    />
                    <Button onClick={handleAddEmail} size="sm">
                      Add
                    </Button>
                  </div>

                  {sharedEmails.length > 0 && (
                    <div className="space-y-2">
                      {sharedEmails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm">{email}</span>
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
