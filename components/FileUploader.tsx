"use client";
import { useRef } from "react";
import * as XLSX from "xlsx";

type FileUploaderProps = {
  onData: (fileResults: { fileName: string, data: any[] }[]) => void;
  onError: (msg: string | null) => void;
};

export default function FileUploader({ onData, onError }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileResults: { fileName: string, data: any[] }[] = [];
    let hasError = false;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      const ext = fileName.split(".").pop()?.toLowerCase();
      
      if (ext !== "xlsx" && ext !== "csv") {
        onError(`File '${fileName}': Only .xlsx or .csv files are supported.`);
        continue;
      }
      
      try {
        const data = await file.arrayBuffer();
        
        // Clean up filename if it contains "balance-table"
        let displayName = fileName;
        const balanceTableIndex = fileName.indexOf("balance-table");
        if (balanceTableIndex !== -1) {
          // Extract the part after "balance-table"
          const afterBalanceTable = fileName.substring(balanceTableIndex + "balance-table".length);
          if (afterBalanceTable.trim()) {
            displayName = afterBalanceTable.trim();
          }
        }
        
        // Helper to map headers to canonical keys
        const normalizeKey = (key: string) => key.replace(/\s+/g, '').toLowerCase();
        // Define required keys and their possible alternatives
        const requiredKeys = ['pk', 'coins', 'action'] as const;
        type RequiredKey = typeof requiredKeys[number];
        const keyAlternatives: Record<RequiredKey, string[]> = {
          'pk': ['pk', 'id', 'userid', 'user_id', 'sk'], // Add 'sk' as alternative for 'pk'
          'coins': ['coins', 'coin', 'amount', 'value'],
          'action': ['action', 'type', 'event', 'actiontype']
        };
        let json: any[];
        if (ext === "csv") {
          const text = new TextDecoder().decode(data);
          const rows = text.split(/\r?\n/).filter(Boolean);
          
          // Early return for empty files
          if (rows.length === 0) {
            throw new Error("File is empty");
          }
          
          const headers = rows[0].split(",").map(h => h.trim());
          // Map normalized header -> original index
          const headerMap: Record<string, number> = {};
          headers.forEach((h, i) => {
            headerMap[normalizeKey(h)] = i;
          });
          
          // Check for required fields using alternatives
          const hasAll = requiredKeys.every(key => {
            return keyAlternatives[key].some(alt => headerMap[normalizeKey(alt)] !== undefined);
          });
          if (!hasAll) throw new Error("Missing required fields: pk/sk, coins, action");
          
          // Find the actual column indices using alternatives - do this once outside the loop
          const pkIndex = keyAlternatives['pk'].find(alt => headerMap[normalizeKey(alt)] !== undefined) || 'pk';
          const coinsIndex = keyAlternatives['coins'].find(alt => headerMap[normalizeKey(alt)] !== undefined) || 'coins';
          const actionIndex = keyAlternatives['action'].find(alt => headerMap[normalizeKey(alt)] !== undefined) || 'action';
          
          // Pre-compute these values outside the loop
          const pkColIndex = headerMap[normalizeKey(pkIndex)];
          const coinsColIndex = headerMap[normalizeKey(coinsIndex)];
          const actionColIndex = headerMap[normalizeKey(actionIndex)];
          
          // Process in chunks for large files
          const CHUNK_SIZE = 10000; // Process 10,000 rows at a time
          json = [];
          
          for (let i = 1; i < rows.length; i += CHUNK_SIZE) {
            const chunk = rows.slice(i, i + CHUNK_SIZE);
            const processedChunk = chunk.map(row => {
              const values = row.split(",");
              return {
                pk: values[pkColIndex]?.trim() || '',
                coins: values[coinsColIndex]?.trim() || '',
                action: values[actionColIndex]?.trim() || '',
              };
            });
            json.push(...processedChunk);
          }
        } else {
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          // Map keys case-insensitively
          json = raw.map((row: any) => {
            const keys = Object.keys(row);
            const mapped: any = {};
            keys.forEach((k) => {
              const nk = normalizeKey(k);
              // Check if the normalized key is one of our alternatives
              for (const reqKey of requiredKeys) {
                if (keyAlternatives[reqKey].includes(nk)) {
                  mapped[reqKey] = row[k];
                  break;
                }
              }
            });
            return {
              pk: mapped['pk'] ?? '',
              coins: mapped['coins'] ?? '',
              action: mapped['action'] ?? '',
            };
          });
          // Check for required fields in headers
          const hasAll = json.length > 0 && requiredKeys.every(key => {
            // For each required key, check if any of its alternatives is present
            return Object.keys(json[0] || {}).some(k => keyAlternatives[key as RequiredKey].includes(normalizeKey(k)));
          });
          if (!hasAll) throw new Error("Missing required fields: pk/sk, coins, action");
        }
        // Validate required fields in all rows
        const missing = json.some(
          (row) =>
            !row.pk ||
            !row.coins ||
            !row.action
        );
        if (missing) throw new Error("Missing required fields: pk, coins, action");
        // Normalize coins to number - process in chunks for large datasets
        const CHUNK_SIZE = 10000;
        const normalizedJson = [];
        
        for (let i = 0; i < json.length; i += CHUNK_SIZE) {
          const chunk = json.slice(i, i + CHUNK_SIZE);
          const normalizedChunk = chunk.map((row) => ({
            ...row,
            coins: Number(row.coins) || 0, // Use || 0 to handle NaN
            pk: String(row.pk || ''),
            action: String(row.action || ''),
          }));
          normalizedJson.push(...normalizedChunk);
        }
        
        json = normalizedJson;
        
        // Add to results array instead of calling onData for each file
        fileResults.push({ fileName: displayName, data: json });
      } catch (e: any) {
        hasError = true;
        onError(`Error processing '${file.name}': ${e.message || "Failed to parse file."}`);
      }
    }
    
    // Only call onData once with all successfully processed files
    if (fileResults.length > 0) {
      if (!hasError) onError(null);
      onData(fileResults);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      tabIndex={0}
      role="button"
      aria-label="Upload file"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        multiple
        className="hidden"
        onChange={onChange}
      />
      <span className="text-lg font-medium text-gray-700 mb-2">Drag & drop or click to upload</span>
      <span className="text-gray-500 text-sm">Accepted: .xlsx, .csv</span>
    </div>
  );
}
