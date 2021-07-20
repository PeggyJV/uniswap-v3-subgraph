let TRACKED_POOLS: string[] = [
    '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
    '0x11b815efb8f581194ae79006d24e0d814b7697f6',
    '0xc5af84701f98fa483ece78af83f11b6c38aca71d',
    '0x4c83a7f819a5c37d64b4c5a2f8238ea082fa1f4e',
    '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
    '0x4585fe77225b41b697c938b018e2ac67ac5a20c0',
    '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
    '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    '0x7bea39867e4169dbe237d55c8242a8f2fcdcc387',
    '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf',
    '0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801',
    '0xfaa318479b7755b2dbfdd34dc306cb28b420ad12',
    '0x2f62f2b4c5fcd7570a709dec05d68ea19c82a9ec',
    '0x5764a6f2212d502bc5970f9f129ffcd61e5d7563',
    '0x6582b944069f6c45e0ea05fb87b0bf71bfaacbfb',
    '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8',
    '0x5180545835bd68810fb7e11c7160bb7ea4ae8744',
    '0x8c54aa2a32a779e6f6fbea568ad85a19e0109c26',
    '0x151ccb92bc1ed5c6d0f9adb5cec4763ceb66ac7f',
    '0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8',
    '0x60594a405d53811d3bc4766596efd80fd545a270',
    '0x6f48eca74b38d2936b02ab603ff4e36a6c0e3a77',
    '0x6c6bc977e13df9b0de53b251522280bb72383700',
    '0xd35efae4097d005720608eaf37e42a5936c94b44',
    '0x9febc984504356225405e26833608b17719c82ae',
    '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
    '0x9a772018fbd77fcd2d25657e5c547baff3fd7d16'
]

export function isTrackedPool(poolAddress: string): boolean {
    return TRACKED_POOLS.includes(poolAddress);
}