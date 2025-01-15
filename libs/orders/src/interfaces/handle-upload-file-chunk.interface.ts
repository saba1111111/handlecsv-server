import * as Multer from 'multer';

export class IHandleUploadFileChunk {
  fileName: string;
  fileChunkIndex: number;
  file: Multer.File;
}
