import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaArrowLeft, FaUsers, FaThumbsUp, FaThumbsDown, FaCamera } from "react-icons/fa";

// Seed images for media posts - Fixed import paths
import potholeImg from "../assets/potholes.webp";
import garbageImg from "../assets/garbage.webp";
import streetlightImg from "../assets/street.webp";
import waterloggingImg from "../assets/Water.webp";

// Communities directory (from Community1)
const communities = [
  { id: 1, name: "Cleanliness", description: "Discuss and report issues related to public cleanliness.", members: "42K members", icon: "🧹" },
  { id: 2, name: "Traffic", description: "Traffic problems, solutions, and road safety discussions.", members: "38K members", icon: "🚦" },
  { id: 3, name: "Water Supply", description: "Water supply, wastage, and related issues.", members: "35K members", icon: "💧" },
  { id: 4, name: "Electricity", description: "Frequent power cuts, electricity bills & solutions.", members: "32K members", icon: "⚡" },
  { id: 5, name: "Sanitation", description: "Garbage disposal and sanitation improvement ideas.", members: "30K members", icon: "🗑️" },
  { id: 6, name: "Roads", description: "Potholes, broken footpaths & road maintenance.", members: "28K members", icon: "🛣️" },
  { id: 7, name: "Public Transport", description: "Bus, metro, and other public transport concerns.", members: "27K members", icon: "🚌" },
  { id: 8, name: "Pollution", description: "Air, noise, and water pollution discussions.", members: "25K members", icon: "🏭" },
  { id: 9, name: "Healthcare", description: "Access to hospitals, quality of service, and complaints.", members: "24K members", icon: "🏥" },
  { id: 10, name: "Citizen Safety", description: "Street lights, women's safety, and public safety issues.", members: "22K members", icon: "🛡️" },
];

// Media posts (image-centric from Community1)
const initialMediaPosts = [
  { id: "m1", title: "Pothole near Market Road causing traffic jams", image: potholeImg, votes: 14, author: "Citizen123", timestamp: "2 hours ago" },
  { id: "m2", title: "Garbage overflow in Sector 15 park area", image: garbageImg, votes: 9, author: "ConcernedResident", timestamp: "5 hours ago" },
  { id: "m3", title: "Broken footpath tiles at City Center", image: streetlightImg, votes: 11, author: "SafetyFirst", timestamp: "1 day ago" },
  { id: "m4", title: "Waterlogging near residential area after rain", image: waterloggingImg, votes: 7, author: "RainwaterWoes", timestamp: "2 days ago" },
];

// Text/forum posts (from Community2)
const initialForumPosts = [
  {
    id: "t1",
    author: "RahulCitizen",
    title: "Pothole Issue on MG Road - Update Needed",
    content: "Has anyone filed a complaint about the pothole near the bus stop? It's been 2 weeks now.",
    category: "Infrastructure",
    upvotes: 24,
    downvotes: 2,
    comments: 8,
    time: "2 hours ago",
    userVote: null,
  },
  {
    id: "t2",
    author: "MumbaiResident",
    title: "Great Response from Municipality!",
    content: "Filed a complaint about street lights last week. They fixed it in 3 days. Really impressed with the response time.",
    category: "Success Story",
    upvotes: 45,
    downvotes: 0,
    comments: 12,
    time: "5 hours ago",
    userVote: null,
  },
  {
    id: "t3",
    author: "GreenWarrior",
    title: "Garbage Collection Schedule Changes",
    content: "Notice from municipal corporation about new garbage collection timings in our area. Morning collection shifted to 7 AM.",
    category: "Announcement",
    upvotes: 18,
    downvotes: 3,
    comments: 5,
    time: "1 day ago",
    userVote: null,
  },
];

const categoryColors = {
  Infrastructure: "bg-blue-100 text-blue-800",
  "Water Supply": "bg-cyan-100 text-cyan-800",
  Electricity: "bg-yellow-100 text-yellow-800",
  Sanitation: "bg-green-100 text-green-800",
  "Success Story": "bg-emerald-100 text-emerald-800",
  Announcement: "bg-purple-100 text-purple-800",
  General: "bg-gray-100 text-gray-800",
};

const forumCategories = Object.keys(categoryColors);

function Community() {
  // Directory vs detail
  const [currentView, setCurrentView] = useState("list"); // 'list' | 'detail'
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Media posts state (Community1)
  const [mediaPosts, setMediaPosts] = useState(initialMediaPosts);
  const [showCreateMediaPost, setShowCreateMediaPost] = useState(false);
  const [newMediaText, setNewMediaText] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  // Forum posts state (Community2)
  const [forumPosts, setForumPosts] = useState(initialForumPosts);
  const [showNewForumPost, setShowNewForumPost] = useState(false);
  const [newForumPost, setNewForumPost] = useState({ title: "", content: "", category: "General" });

  // Cleanup object URL for preview to avoid leaks [web:139][web:141]
  useEffect(() => {
    return () => {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
  }, [newImagePreview]);

  const handleEnterCommunity = (community) => {
    setSelectedCommunity(community);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedCommunity(null);
  };

  const handleMediaImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Revoke previous object URL to prevent memory leak
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    
    setNewImageFile(file);
    const url = URL.createObjectURL(file);
    setNewImagePreview(url);
  };

  const resetMediaForm = () => {
    setNewMediaText("");
    setNewImageFile(null);
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImagePreview(null);
    setShowCreateMediaPost(false);
  };

  const handleCreateMediaPost = (e) => {
    e.preventDefault();
    if (!newMediaText.trim()) return;
    const newEntry = {
      id: `m-${Date.now()}`,
      title: newMediaText,
      image: newImagePreview,
      votes: 0,
      author: "You",
      timestamp: "Just now",
    };
    setMediaPosts((prev) => [newEntry, ...prev]);
    
    // Revoke object URL after post creation to prevent memory leak
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    
    setNewMediaText("");
    setNewImageFile(null);
    setNewImagePreview(null);
    setShowCreateMediaPost(false);
  };

  const handleMediaVote = (postId, delta) => {
    setMediaPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, votes: Math.max(0, p.votes + delta) } : p))
    );
  };

  const getCategoryChip = (cat) => categoryColors[cat] || categoryColors.General;

  // Forum vote logic (toggle and switch)
  const handleForumVote = (postId, voteType) => {
    setForumPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        let { upvotes, downvotes, userVote } = post;
        if (userVote === voteType) {
          // remove same vote
          if (voteType === "up") upvotes--;
          else downvotes--;
          userVote = null;
        } else if (userVote) {
          // switch vote
          if (userVote === "up") {
            upvotes--;
            downvotes++;
          } else {
            downvotes--;
            upvotes++;
          }
          userVote = voteType;
        } else {
          // new vote
          if (voteType === "up") upvotes++;
          else downvotes++;
          userVote = voteType;
        }
        return { ...post, upvotes, downvotes, userVote };
      })
    );
  };

  const handleCreateForumPost = (e) => {
    e.preventDefault();
    const { title, content, category } = newForumPost;
    if (!title.trim() || !content.trim()) return;
    const p = {
      id: `t-${Date.now()}`,
      author: "You",
      title,
      content,
      category,
      upvotes: 1,
      downvotes: 0,
      comments: 0,
      time: "Just now",
      userVote: "up",
    };
    setForumPosts((prev) => [p, ...prev]);
    setNewForumPost({ title: "", content: "", category: "General" });
    setShowNewForumPost(false);
  };

  // LIST (Directory) VIEW - Now standalone [web:138][web:139]
  if (currentView === "list") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center mb-8">
            <FaUsers className="text-3xl text-emerald-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
              <p className="text-gray-700 text-base">Browse the most active citizen grievance communities</p>
            </div>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.map((community, index) => (
              <div
                key={community.id}
                onClick={() => handleEnterCommunity(community)}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl bg-emerald-50 p-3 rounded-full">{community.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h2 className="font-semibold text-lg text-gray-900">{community.name}</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{community.description}</p>
                    <span className="text-sm text-emerald-600 font-medium">{community.members}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW - Now standalone [web:138][web:139]
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto p-6">
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 h-32 relative">
            <button
              onClick={handleBackToList}
              className="absolute top-4 left-4 px-4 py-2 bg-white text-emerald-700 hover:bg-gray-50 font-semibold rounded-md shadow-sm transition-colors duration-200 flex items-center gap-2"
            >
              <FaArrowLeft />
              Back to Communities
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-3xl bg-emerald-50 p-3 rounded-full">{selectedCommunity?.icon}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedCommunity?.name}</h1>
                <p className="text-gray-600">{selectedCommunity?.members} • Active community</p>
              </div>
            </div>
            <p className="text-gray-700">Citizens discussing grievances and working on solutions together.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateMediaPost(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200 flex items-center gap-2"
            >
              <FaPlus />
              New Photo Post
            </button>
            <button
              onClick={() => setShowNewForumPost((v) => !v)}
              className="px-4 py-2 border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 font-semibold rounded-md transition-colors duration-200"
            >
              New Text Post
            </button>
          </div>
        </div>

        {/* Create New Text Post (inline) */}
        {showNewForumPost && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Text Post</h3>
              <form onSubmit={handleCreateForumPost}>
                <div className="mb-3">
                  <select
                    value={newForumPost.category}
                    onChange={(e) => setNewForumPost({ ...newForumPost, category: e.target.value })}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                  >
                    {forumCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Post title..."
                  value={newForumPost.title}
                  onChange={(e) => setNewForumPost({ ...newForumPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-3 bg-white text-gray-900"
                  required
                />
                <textarea
                  placeholder="What's on your mind?"
                  value={newForumPost.content}
                  onChange={(e) => setNewForumPost({ ...newForumPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-32 mb-3 bg-white text-gray-900 resize-none"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewForumPost(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Combined Posts Feed: Media first, then Forum */}
        <div className="space-y-6">
          {/* Media posts (with image and simple up/down buttons) */}
          {mediaPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{post.author}</span>
                      <span className="text-gray-500 text-sm ml-2">{post.timestamp}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{post.title}</h3>
                {post.image && (
                  <img src={post.image} alt="Post content" className="w-full max-h-80 object-cover rounded-lg mb-4" />
                )}
              </div>

              <div className="border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => handleMediaVote(post.id, 1)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors duration-200"
                  >
                    <FaThumbsUp />
                    <span className="text-sm">Upvote</span>
                  </button>

                  <span className="font-semibold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-md">
                    {post.votes}
                  </span>

                  <button
                    onClick={() => handleMediaVote(post.id, -1)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                  >
                    <FaThumbsDown />
                    <span className="text-sm">Downvote</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Forum posts (text-first with category chips and arrow voting) */}
          {forumPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Vote Column */}
                  <div className="flex flex-col items-center min-w-[60px]">
                    <button
                      onClick={() => handleForumVote(post.id, "up")}
                      className={`p-1 rounded hover:bg-gray-100 ${post.userVote === "up" ? "text-emerald-600" : "text-gray-500"}`}
                    >
                      ▲
                    </button>
                    <span className="text-sm font-semibold text-gray-700">{post.upvotes - post.downvotes}</span>
                    <button
                      onClick={() => handleForumVote(post.id, "down")}
                      className={`p-1 rounded hover:bg-gray-100 ${post.userVote === "down" ? "text-red-600" : "text-gray-500"}`}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryChip(post.category)}`}>
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-500">Posted by u/{post.author} • {post.time}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-700 mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <button className="flex items-center gap-1 hover:text-gray-700">💬 {post.comments} comments</button>
                      <button className="flex items-center gap-1 hover:text-gray-700">📤 Share</button>
                      <button className="flex items-center gap-1 hover:text-gray-700">💾 Save</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Photo Post Modal */}
        {showCreateMediaPost && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create a Photo Post</h2>
                <form onSubmit={handleCreateMediaPost} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Describe your grievance</label>
                    <textarea
                      value={newMediaText}
                      onChange={(e) => setNewMediaText(e.target.value)}
                      placeholder="Write your grievance or concern..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      rows="4"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Add Photo (Optional)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMediaImageChange}
                        className="hidden"
                        id="post-image"
                      />
                      <label
                        htmlFor="post-image"
                        className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold rounded-md transition-colors duration-200 cursor-pointer flex items-center gap-2"
                      >
                        <FaCamera />
                        Choose Photo
                      </label>
                      {newImageFile && <span className="text-sm text-gray-600">{newImageFile.name}</span>}
                    </div>
                    {newImagePreview && (
                      <img src={newImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mt-3" />
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetMediaForm}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;
