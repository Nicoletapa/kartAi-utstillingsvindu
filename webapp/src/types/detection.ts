export interface Detection {
  file_name: string;
  drawing_type?: string | string[];
  scale?: string;
  room_names?: string;
  cardinal_direction?: string;
  documentId?: number;
  base64?: string;
}
