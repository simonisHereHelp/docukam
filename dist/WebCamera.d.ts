export type CaptureType = "jpeg" | "png" | "webp";
export type CaptureQuality = 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;
export type CaptureMode = "front" | "back";
export type FacingMode = "user" | "environment";
export interface WebCameraProps {
    className?: string;
    style?: React.CSSProperties;
    videoClassName?: string;
    videoStyle?: React.CSSProperties;
    getFileName?: () => string;
    captureMode?: CaptureMode;
    captureType?: CaptureType;
    captureQuality?: CaptureQuality;
    onError?: (err: Error) => void;
}
export type WebCameraHandler = {
    capture: () => Promise<File | null>;
    switch: (facingMode?: FacingMode) => Promise<void>;
    getMode: () => CaptureMode;
};
export declare const WebCamera: import('react').ForwardRefExoticComponent<WebCameraProps & import('react').RefAttributes<WebCameraHandler>>;
