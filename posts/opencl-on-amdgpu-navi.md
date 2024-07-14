---
date: '2024-07-13'
title: OpenCL on AMD (amdgpu) Navi cards
---

Oh man this took way too much effort and research. Hopefully this will help others in the future.

OpenCL applications were crashing for general GPGPU workloads, 3D rendering worked fine.

What doesn't work:

- ROCm
- mesa-libOpenCL (Clover implementation)
- Outdated recommendations about AMDGPU-Pro drivers, etc.

What does work: __mesa-libOpenCL (rusticl implementation)__

So what do you need to install on Fedora 40:

- mesa-libOpenCL
- mesa-libOpenCL-devel
- clinfo
- opencl-filesystem
- opencl-headers
- ocl-icd
- ocl-icd-devel
- libclc
- libclc-devel


The default Clover mesa OpenCL implementation will crash the card:

```
[  395.075440] amdgpu 0000:0b:00.0: amdgpu: [gfxhub] page fault (src_id:0 ring:24 vmid:7 pasid:32775)
[  395.075449] amdgpu 0000:0b:00.0: amdgpu:  in process genefer22g_linu pid 13116 thread genefer22g:cs0 pid 13118
[  395.075454] amdgpu 0000:0b:00.0: amdgpu:   in page starting at address 0x0000000000000000 from client 0x1b (UTCL2)
[  395.075458] amdgpu 0000:0b:00.0: amdgpu: GCVM_L2_PROTECTION_FAULT_STATUS:0x00701431
[  395.075462] amdgpu 0000:0b:00.0: amdgpu: 	 Faulty UTCL2 client ID: SQC (data) (0xa)
[  395.075465] amdgpu 0000:0b:00.0: amdgpu: 	 MORE_FAULTS: 0x1
[  395.075468] amdgpu 0000:0b:00.0: amdgpu: 	 WALKER_ERROR: 0x0
[  395.075471] amdgpu 0000:0b:00.0: amdgpu: 	 PERMISSION_FAULTS: 0x3
[  395.075473] amdgpu 0000:0b:00.0: amdgpu: 	 MAPPING_ERROR: 0x0
[  395.075476] amdgpu 0000:0b:00.0: amdgpu: 	 RW: 0x0
[  395.075483] amdgpu 0000:0b:00.0: amdgpu: [gfxhub] page fault (src_id:0 ring:24 vmid:7 pasid:32775)
[  395.075488] amdgpu 0000:0b:00.0: amdgpu:  in process genefer22g_linu pid 13116 thread genefer22g:cs0 pid 13118
[  395.075492] amdgpu 0000:0b:00.0: amdgpu:   in page starting at address 0x0000000000000000 from client 0x1b (UTCL2)
[  395.075495] amdgpu 0000:0b:00.0: amdgpu: GCVM_L2_PROTECTION_FAULT_STATUS:0x00000000
...
```

You need to use the `rusticl` implementation of the mesa-libOpenCL package.

Enable it via the following commands.

```
export OCL_ICD_VENDORS=/etc/OpenCL/vendors/rusticl.icd
export RUSTICL_ENABLE=radeonsi
```

When running `clinfo` you will now only see a single platform instead of two.

An OpenCL benchmark like [ProjectPhysX/OpenCL-Benchmark](https://github.com/ProjectPhysX/OpenCL-Benchmark) will no longer trigger a reset for the GPU.

List of installed versions related to OpenCL on my AMD Radeon RX 6600:

- mesa-dri-drivers.x86_64                              24.1.2-7.fc40
- mesa-filesystem.x86_64                               24.1.2-7.fc40
- mesa-libEGL.x86_64                                   24.1.2-7.fc40
- mesa-libGL.x86_64                                    24.1.2-7.fc40
- mesa-libGLU.x86_64                                   9.0.3-4.fc40
- mesa-libOpenCL.x86_64                                24.1.2-7.fc40
- mesa-libOpenCL-devel.x86_64                          24.1.2-7.fc40
- mesa-libgbm.x86_64                                   24.1.2-7.fc40
- mesa-libglapi.x86_64                                 24.1.2-7.fc40
- mesa-va-drivers.x86_64                               24.1.2-7.fc40
- mesa-vulkan-drivers.x86_64                           24.1.2-7.fc40
- opencl-filesystem.noarch                             1.0-20.fc40
- opencl-headers.noarch                                3.0-29.20240412git8275634.fc40
- ocl-icd.x86_64                                       2.3.2-6.fc40
- ocl-icd-devel.x86_64                                 2.3.2-6.fc40
- libclc.x86_64                                        18.1.6-1.fc40
- libclc-devel.x86_64                                  18.1.6-1.fc40
