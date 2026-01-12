// 分享数据序列化和反序列化工具

// 条件导入 lz-string（如果未安装则使用不压缩的方式）
// 使用条件导入避免构建时错误
let LZString: typeof import('lz-string') | null = null;

// 在客户端使用动态导入，服务端使用require
if (typeof window !== 'undefined') {
  // 客户端：异步加载
  import('lz-string')
    .then((mod) => {
      LZString = mod.default || mod;
    })
    .catch(() => {
      // lz-string 未安装，将使用不压缩的方式
    });
} else {
  // 服务端：同步require
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    LZString = require('lz-string');
  } catch {
    // lz-string 未安装，将使用不压缩的方式
  }
}

// 分享数据接口
export interface ShareData {
  // 基础数据
  distance: string;
  hours: string;
  minutes: string;
  seconds: string;
  paceMinutes: string;
  paceSeconds: string;
  mode: 'pace' | 'time' | 'distance';
  unit: 'km' | 'mi';
  
  // 分段策略
  splitStrategy: 'even' | 'negative' | 'slightPositive' | 'tenTenTen' | 'custom';
  splitStrengthSeconds: number;
  fineTuneAfter5k?: number;
  fineTuneAfter10k?: number;
  fineTuneAfterHalf?: number;
  fineTuneAfter30k?: number;
  
  // 环境参数（可选）
  environmentParams?: {
    temp: number;
    wind: number;
    surface: 'asphalt' | 'track' | 'cobblestone' | 'trail';
    gain: number;
    loss?: number;
  };
  
  // 心率参数（可选）
  maxHR?: string;
  restHR?: string;
}

/**
 * 序列化分享数据为URL查询字符串
 * 如果超过200字符，使用LZ-String压缩（如果可用）
 */
export function serializeShareData(data: ShareData): string {
  // 构建基础查询参数
  const params = new URLSearchParams();
  
  // 基础数据
  if (data.distance) params.set('dist', data.distance);
  if (data.paceMinutes || data.paceSeconds) {
    const paceTotal = (parseInt(data.paceMinutes || '0') * 60) + parseInt(data.paceSeconds || '0');
    if (paceTotal > 0) params.set('pace', paceTotal.toString());
  }
  if (data.hours || data.minutes || data.seconds) {
    const timeTotal = (parseInt(data.hours || '0') * 3600) + 
                     (parseInt(data.minutes || '0') * 60) + 
                     parseInt(data.seconds || '0');
    if (timeTotal >= 0) params.set('time', timeTotal.toString());
  }
  if (data.mode !== 'pace') params.set('mode', data.mode);
  if (data.unit !== 'km') params.set('unit', data.unit);
  
  // 分段策略
  if (data.splitStrategy !== 'even') params.set('strategy', data.splitStrategy);
  if (data.splitStrengthSeconds !== 10) params.set('strength', data.splitStrengthSeconds.toString());
  
  // 高级微调
  if (data.fineTuneAfter5k) params.set('tune5k', data.fineTuneAfter5k.toString());
  if (data.fineTuneAfter10k) params.set('tune10k', data.fineTuneAfter10k.toString());
  if (data.fineTuneAfterHalf) params.set('tuneHalf', data.fineTuneAfterHalf.toString());
  if (data.fineTuneAfter30k) params.set('tune30k', data.fineTuneAfter30k.toString());
  
  // 环境参数
  if (data.environmentParams) {
    const env = data.environmentParams;
    params.set('temp', env.temp.toString());
    params.set('wind', env.wind.toString());
    params.set('surface', env.surface);
    params.set('gain', env.gain.toString());
    if (env.loss) params.set('loss', env.loss.toString());
  }
  
  // 心率参数
  if (data.maxHR) params.set('maxHR', data.maxHR);
  if (data.restHR && data.restHR !== '60') params.set('restHR', data.restHR);
  
  const queryString = params.toString();
  
  // 如果超过200字符，尝试使用压缩（如果lz-string已安装）
  if (queryString.length > 200 && LZString) {
    try {
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
      return `?share=${compressed}`;
    } catch (error) {
      console.warn('LZ-String compression failed, using uncompressed URL:', error);
      // 降级到不压缩的方式
    }
  }
  
  return `?${queryString}`;
}

/**
 * 反序列化URL查询字符串为分享数据
 */
export function deserializeShareData(searchParams: URLSearchParams): Partial<ShareData> | null {
  // 检查是否有压缩数据
  const compressed = searchParams.get('share');
  if (compressed && LZString) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
      if (decompressed) {
        return JSON.parse(decompressed) as ShareData;
      }
    } catch (error) {
      console.error('Failed to decompress share data:', error);
      return null;
    }
  } else if (compressed && !LZString) {
    console.warn('Compressed share data detected but lz-string is not installed. Please install lz-string to decode this URL.');
    return null;
  }
  
  // 解析普通查询参数
  const data: Partial<ShareData> = {};
  
  const distParam = searchParams.get('dist');
  if (distParam) data.distance = distParam;
  
  const paceParam = searchParams.get('pace');
  if (paceParam) {
    const paceTotal = parseInt(paceParam, 10);
    if (!isNaN(paceTotal) && paceTotal > 0) {
      const minutes = Math.floor(paceTotal / 60);
      const seconds = paceTotal % 60;
      data.paceMinutes = minutes.toString();
      data.paceSeconds = seconds.toString();
    }
  }
  
  const timeParam = searchParams.get('time');
  if (timeParam) {
    const timeTotal = parseInt(timeParam, 10);
    if (!isNaN(timeTotal) && timeTotal >= 0) {
      const hours = Math.floor(timeTotal / 3600);
      const minutes = Math.floor((timeTotal % 3600) / 60);
      const seconds = timeTotal % 60;
      data.hours = hours.toString();
      data.minutes = minutes.toString();
      data.seconds = seconds.toString();
    }
  }
  
  const modeParam = searchParams.get('mode');
  if (modeParam && ['pace', 'time', 'distance'].includes(modeParam)) {
    data.mode = modeParam as 'pace' | 'time' | 'distance';
  }
  
  const unitParam = searchParams.get('unit');
  if (unitParam && ['km', 'mi'].includes(unitParam)) {
    data.unit = unitParam as 'km' | 'mi';
  }
  
  const strategyParam = searchParams.get('strategy');
  if (strategyParam && ['even', 'negative', 'slightPositive', 'tenTenTen', 'custom'].includes(strategyParam)) {
    data.splitStrategy = strategyParam as 'even' | 'negative' | 'slightPositive' | 'tenTenTen' | 'custom';
  }
  
  const strengthParam = searchParams.get('strength');
  if (strengthParam) {
    const strength = parseInt(strengthParam, 10);
    if (!isNaN(strength)) data.splitStrengthSeconds = strength;
  }
  
  // 高级微调
  const tune5k = searchParams.get('tune5k');
  if (tune5k) data.fineTuneAfter5k = parseFloat(tune5k);
  const tune10k = searchParams.get('tune10k');
  if (tune10k) data.fineTuneAfter10k = parseFloat(tune10k);
  const tuneHalf = searchParams.get('tuneHalf');
  if (tuneHalf) data.fineTuneAfterHalf = parseFloat(tuneHalf);
  const tune30k = searchParams.get('tune30k');
  if (tune30k) data.fineTuneAfter30k = parseFloat(tune30k);
  
  // 环境参数
  const temp = searchParams.get('temp');
  const wind = searchParams.get('wind');
  const surface = searchParams.get('surface');
  const gain = searchParams.get('gain');
  const loss = searchParams.get('loss');
  if (temp || wind || surface || gain) {
    const validSurfaces: Array<'asphalt' | 'track' | 'cobblestone' | 'trail'> = ['asphalt', 'track', 'cobblestone', 'trail'];
    const surfaceValue = surface && validSurfaces.includes(surface as 'asphalt' | 'track' | 'cobblestone' | 'trail')
      ? (surface as 'asphalt' | 'track' | 'cobblestone' | 'trail')
      : 'asphalt';
    data.environmentParams = {
      temp: temp ? parseFloat(temp) : 0,
      wind: wind ? parseFloat(wind) : 0,
      surface: surfaceValue,
      gain: gain ? parseFloat(gain) : 0,
      loss: loss ? parseFloat(loss) : undefined,
    };
  }
  
  // 心率参数
  const maxHR = searchParams.get('maxHR');
  if (maxHR) data.maxHR = maxHR;
  const restHR = searchParams.get('restHR');
  if (restHR) data.restHR = restHR;
  
  return Object.keys(data).length > 0 ? data : null;
}
