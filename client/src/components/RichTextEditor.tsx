import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Image,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Palette,
} from "lucide-react";

interface EditorImage {
  id: string;
  src: string;
  alt: string;
  position: "float-left" | "float-right" | "block";
  width?: number;
  height?: number;
}

function RichTextEditor({
  content,
  setContent,
}: {
  content: string;
  setContent: Function;
}) {
  const [images, setImages] = useState<EditorImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Predefined color palette
  const colorPalette = [
    "#000000",
    "#404040",
    "#808080",
    "#C0C0C0",
    "#FFFFFF",
    "#FF0000",
    "#FF8000",
    "#FFFF00",
    "#80FF00",
    "#00FF00",
    "#00FF80",
    "#00FFFF",
    "#0080FF",
    "#0000FF",
    "#8000FF",
    "#FF00FF",
    "#FF0080",
    "#800000",
    "#808000",
    "#008000",
    "#008080",
    "#000080",
    "#800080",
    "#FF4444",
    "#FF8844",
    "#FFFF44",
    "#88FF44",
    "#44FF44",
    "#44FF88",
    "#44FFFF",
    "#4488FF",
    "#4444FF",
    "#8844FF",
    "#FF44FF",
    "#FF4488",
  ];

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, []);

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color);
      execCommand("foreColor", color);
      setShowColorPicker(false);
    },
    [execCommand]
  );

  const handleColorPickerToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setShowColorPicker(!showColorPicker);
    },
    [showColorPicker]
  );

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      // Prevent setting content to the browser's default <br> on empty
      if (newContent === "<div><br></div>" || newContent === "<br>") {
        setContent("");
      } else {
        setContent(newContent);
      }
    }
  }, []);

  // This effect synchronizes the React state back to the DOM
  // ONLY when it's absolutely necessary (e.g., undo/redo).
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`${import.meta.env.VITE_API}api/photo`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        const cloudImageUrl = data.url;
        const imageId = `img_${Date.now()}`;
        const newImage: EditorImage = {
          id: imageId,
          src: cloudImageUrl,
          alt: file.name,
          position: "block",
        };
        setImages((prev) => [...prev, newImage]);

        const img = `<img src="${newImage.src}" alt="${newImage.alt}" data-image-id="${imageId}" class="block rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow" style="display: block; margin: 1rem auto; max-width: 100%; height: auto;" />`;

        if (editorRef.current) {
          editorRef.current.focus();

          const selection = window.getSelection();
          if (selection && savedRange.current) {
            selection.removeAllRanges();
            selection.addRange(savedRange.current);
            savedRange.current = null;

            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(range.createContextualFragment(img));
            range.collapse(false);
          } else {
            execCommand("insertHTML", img);
          }

          handleEditorInput();
        }
      } catch (err: any) {
        console.error("Image upload error:", err);
        alert("Failed to upload image");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [handleEditorInput]
  );

  const handleImageClick = useCallback(
    (imageId: string) => {
      setSelectedImage(selectedImage === imageId ? null : imageId);
    },
    [selectedImage]
  );

  const handleImagePosition = useCallback(
    (imageId: string, newPosition: "float-left" | "float-right" | "block") => {
      if (editorRef.current) {
        const imgElement = editorRef.current.querySelector(
          `[data-image-id="${imageId}"]`
        ) as HTMLImageElement;
        if (imgElement) {
          imgElement.classList.remove("float-left", "float-right", "block");

          imgElement.classList.add(newPosition);

          switch (newPosition) {
            case "float-left":
              imgElement.style.cssText =
                "float: left; margin: 0 1rem 1rem 0; max-width: 50%; height: auto;";
              break;
            case "float-right":
              imgElement.style.cssText =
                "float: right; margin: 0 0 1rem 1rem; max-width: 50%; height: auto;";
              break;
            case "block":
            default:
              imgElement.style.cssText =
                "display: block; margin: 1rem auto; max-width: 100%; height: auto;";
              break;
          }

          handleEditorInput(); // Sync state after change
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageId ? { ...img, position: newPosition } : img
            )
          );
        }
      }
    },
    [handleEditorInput]
  );

  const handleImageResize = useCallback(
    (imageId: string, newWidth: number) => {
      if (editorRef.current) {
        const imgElement = editorRef.current.querySelector(
          `[data-image-id="${imageId}"]`
        ) as HTMLImageElement;
        if (imgElement) {
          imgElement.style.maxWidth = `${newWidth}%`;
          handleEditorInput(); // Sync state after change
        }
      }
    },
    [handleEditorInput]
  );

  const handleImageDelete = useCallback(
    (imageId: string) => {
      if (editorRef.current) {
        const imgElement = editorRef.current.querySelector(
          `[data-image-id="${imageId}"]`
        );
        if (imgElement) {
          imgElement.remove();
          handleEditorInput(); // Sync state after change
          setImages((prev) => prev.filter((img) => img.id !== imageId));
          setSelectedImage(null);
        }
      }
    },
    [handleEditorInput]
  );

  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        const imageId = target.getAttribute("data-image-id");
        if (imageId) {
          handleImageClick(imageId);
        }
      } else {
        // Deselect image if clicking elsewhere in the editor
        if (selectedImage) {
          setSelectedImage(null);
        }
      }
    },
    [handleImageClick, selectedImage]
  );

  const handleEditorFocus = useCallback(() => {
    if (editorRef.current && editorRef.current.innerHTML.trim() === "") {
      // The CSS placeholder handles the visual cue, so we just focus.
      editorRef.current.focus();
    }
  }, []);

  const handleImageButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (editorRef.current) {
      editorRef.current.focus(); // Ensure editor is focused
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedRange.current = selection.getRangeAt(0).cloneRange();
      }
    }
    fileInputRef.current?.click();
  }, []);

  const toolbarButtons = [
    { icon: Bold, command: "bold", title: "Bold" },
    { icon: Italic, command: "italic", title: "Italic" },
    { icon: Underline, command: "underline", title: "Underline" },
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, command: "justifyRight", title: "Align Right" },
    { icon: List, command: "insertUnorderedList", title: "Bullet List" },
    {
      icon: ListOrdered,
      command: "insertOrderedList",
      title: "Numbered List",
    },
    {
      icon: Quote,
      command: "formatBlock",
      value: "blockquote",
      title: "Quote",
    },
    { icon: Link, command: "createLink", title: "Insert Link" },
    { icon: Undo, command: "undo", title: "Undo" },
    { icon: Redo, command: "redo", title: "Redo" },
  ];

  const handleLinkClick = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  return (
    <div className="w-full mx-auto p-3 bg-white text-black rounded-xl border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border mb-4">
        <select
          onChange={(e) => execCommand("fontSize", e.target.value)}
          className="ml-1 px-2 py-1 border rounded text-sm"
          defaultValue="3"
        >
          <option value="2">S</option>
          <option value="3">M</option>
          <option value="4">L</option>
          <option value="5">XL</option>
        </select>
        {toolbarButtons.map((button, index) => (
          <button
            key={index}
            type="button" // FIX: Prevents form submission
            onMouseDown={(e) => {
              // Use onMouseDown to prevent editor blur
              e.preventDefault();
              button.command === "createLink"
                ? handleLinkClick()
                : execCommand(button.command, button.value);
            }}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors duration-200 text-gray-700 hover:text-gray-900"
            title={button.title}
          >
            <button.icon size={18} />
          </button>
        ))}
        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Color Picker */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button" // FIX: Prevents form submission
            onMouseDown={handleColorPickerToggle}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors duration-200 text-gray-700 hover:text-gray-900 flex items-center gap-1"
            title="Text Color"
          >
            <Palette size={18} />
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border z-20">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    type="button" // Also set type here for safety
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  title="Custom Color"
                />
                <span className="text-xs text-gray-600">Custom</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          type="button" // FIX: Prevents form submission
          onMouseDown={handleImageButtonClick} // Use the new handler
          className="p-2 hover:bg-gray-200 rounded-md transition-colors duration-200 text-gray-700 hover:text-gray-900 flex items-center gap-2"
          title="Insert Image"
        >
          <Image size={18} />
          <span className="text-sm">Image</span>
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onClick={handleEditorClick}
          onFocus={handleEditorFocus}
          className={`min-h-96 p-3 border-2 overflow-auto border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-left prose prose-sm w-full ${
            !content ? "is-empty" : ""
          }`}
          style={{
            minHeight: "100px",
            height: "450px", // Set a fixed height
            overflowY: "auto",
            direction: "ltr",
          }}
          suppressContentEditableWarning={true}
        />
        <style>
          {`
            .is-empty:before {
              content: 'Start typing your content here...';
              position: absolute;
              color: #a1a1aa; /* Zinc 400 */
              pointer-events: none;
              left: 1rem;
              top: 1rem;
            }
            div[contenteditable] ul {
              list-style-type: disc !important;
              margin-left: 1.5rem !important;
              padding-left: 0.5rem !important;
            }
            div[contenteditable] ol {
              list-style-type: decimal !important;
              margin-left: 1.5rem !important;
              padding-left: 0.5rem !important;
            }
            div[contenteditable] li {
              margin-bottom: 0.25rem !important;
              display: list-item !important;
            }
            div[contenteditable] blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 1rem;
              margin: 1rem 0;
              font-style: italic;
              color: #6b7280;
            }
            div[contenteditable] img {
              user-select: none;
            }
            div[contenteditable] img.float-left {
              float: left;
              margin: 0 1rem 1rem 0;
            }
            div[contenteditable] img.float-right {
              float: right;
              margin: 0 0 1rem 1rem;
            }
            div[contenteditable] img.block {
              display: block;
              margin: 1rem auto;
            }
            /* Add this new CSS rule for links */
            div[contenteditable] a {
              color: #3b82f6; /* Tailwind's blue-500 */
              text-decoration: underline;
            }
          `}
        </style>
        {/* Image Controls */}
        {selectedImage && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border p-3 z-10">
            <h4 className="font-semibold text-sm mb-2">Image Controls</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Position
                </label>
                <select
                  onChange={(e) =>
                    handleImagePosition(selectedImage, e.target.value as any)
                  }
                  className="w-full px-2 py-1 border rounded text-xs"
                  defaultValue={
                    images.find((img) => img.id === selectedImage)?.position ||
                    "block"
                  }
                >
                  <option value="block">Block (Center)</option>
                  <option value="float-left">Float Left</option>
                  <option value="float-right">Float Right</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Width
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  className="w-full"
                  onChange={(e) =>
                    handleImageResize(selectedImage, parseInt(e.target.value))
                  }
                />
              </div>
              <button
                type="button" // Also set type here for safety
                onClick={() => handleImageDelete(selectedImage)}
                className="w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Delete Image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Status bar */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>Images: {images.length}</span>
          <span>Characters: {content.replace(/<[^>]*>/g, "").length}</span>
        </div>
      </div>
    </div>
  );
}

export default RichTextEditor;