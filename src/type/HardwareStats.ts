export interface CpuStats {
    usage: number;
    cores: number[];
}

export interface RamStats {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
}

export interface GpuStats {
    name: string;
    vram: number;
    driverVersion: string;
}

export interface HardwareStatistics {
    cpu: CpuStats;
    ram: RamStats;
    gpu: GpuStats[];
} 