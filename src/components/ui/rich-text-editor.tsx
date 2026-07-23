"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

// Mismo toolbar que quillModules del Angular.
const modules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ font: ["Arial"] }],
    [{ align: [] }, { list: "ordered" }, { list: "bullet" }],
    ["clean"],
    ["image"],
  ],
};

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      preserveWhitespace
    />
  );
}
