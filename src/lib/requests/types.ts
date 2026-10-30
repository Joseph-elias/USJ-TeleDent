export type RequestInput = {
  patient_name: string;
  patient_file_number: string;
  date_of_birth: string;
  phone: string;
  email: string | null;
  reason: string;
  description: string;
  symptom_answers: Record<string, string>;
  department: string;
};

export type PhotoMetadata = {
  id: string;
  request_id: string;
  storage_path: string;
  content_type: string;
  size: number;
  created_at: string;
};

export type SavedRequest = RequestInput & {
  id: string;
  request_reference: string;
  status: string;
  priority: string;
  dentist_decision: string | null;
  dentist_response: string | null;
  proposed_appointment_at: string | null;
  call_video_details: string | null;
  tracking_token_hash: string;
  created_at: string;
  updated_at: string;
  photos: PhotoMetadata[];
};

// Only the fields needed for patient tracking leave the storage module.
export type TrackingRequest = Pick<SavedRequest,
  "request_reference" | "created_at" | "department" | "reason" | "status" |
  "dentist_decision" | "dentist_response" | "proposed_appointment_at" | "call_video_details" | "updated_at"
> & { photos: { id: string }[] };

export type SubmissionResult = {
  request_reference: string;
  status: "nouveau";
  tracking_path: string;
};
