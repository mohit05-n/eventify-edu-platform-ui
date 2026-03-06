"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, FileText, Image, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FileUpload({
    onUpload,
    accept = "*",
    maxSize = 5 * 1024 * 1024, // 5MB default
    multiple = false,
    className,
    placeholder = "Drag and drop files here, or click to browse",
    documentType = "other"
}) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const inputRef = useRef(null)

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragOver(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        validateAndAddFiles(droppedFiles)
    }

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        validateAndAddFiles(selectedFiles)
    }

    const validateAndAddFiles = (newFiles) => {
        setError(null)
        const validFiles = []

        for (const file of newFiles) {
            if (file.size > maxSize) {
                setError(`File "${file.name}" is too large. Max size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
                continue
            }
            validFiles.push(file)
        }

        if (multiple) {
            setFiles(prev => [...prev, ...validFiles])
        } else {
            setFiles(validFiles.slice(0, 1))
        }
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return
        setUploading(true)
        setError(null)

        try {
            for (const file of files) {
                // Actually upload the file to the server
                const formData = new FormData()
                formData.append("file", file)

                const uploadResponse = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })

                if (!uploadResponse.ok) {
                    const errData = await uploadResponse.json()
                    throw new Error(errData.error || "Upload failed")
                }

                const uploadData = await uploadResponse.json()
                const fileUrl = uploadData.url

                if (onUpload) {
                    await onUpload({
                        file_name: file.name,
                        file_url: fileUrl,
                        file_type: file.type,
                        document_type: documentType
                    })
                }
            }

            setFiles([])
        } catch (err) {
            setError(err.message || "Upload failed. Please try again.")
            console.error("[v0] Upload error:", err)
        } finally {
            setUploading(false)
        }
    }

    const getFileIcon = (file) => {
        if (file.type.startsWith("image/")) return Image
        return FileText
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Drop Zone */}
            <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                    isDragOver
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <motion.div
                    animate={{ y: isDragOver ? -5 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Upload className={cn(
                        "w-12 h-12 mx-auto mb-4",
                        isDragOver ? "text-primary" : "text-muted-foreground"
                    )} />
                    <p className="text-muted-foreground">{placeholder}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Max file size: {(maxSize / 1024 / 1024).toFixed(1)}MB
                    </p>
                </motion.div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {files.map((file, index) => {
                            const FileIcon = getFileIcon(file)
                            return (
                                <motion.div
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                                >
                                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeFile(index)
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )
                        })}

                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full"
                        >
                            {uploading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                                    />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Upload {files.length} file{files.length > 1 ? "s" : ""}
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default FileUpload
