## Anchor comments  

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that can be easily `grep`ped for.  

### Guidelines:  

- Use `AIDEV-NOTE:`, `AIDEV-TODO:`, or `AIDEV-QUESTION:` (all-caps prefix) for comments aimed at AI and developers.  
- Keep them concise (≤ 120 chars).  
- **Important:** Before scanning files, always first try to **locate existing anchors** `AIDEV-*` in relevant subdirectories.  
- **Update relevant anchors** when modifying associated code.  
- **Do not remove `AIDEV-NOTE`s** without explicit human instruction.  

Example:  
# AIDEV-NOTE: perf-hot-path; avoid extra allocations (see ADR-24)  
async def render_feed(...):  
    ...  


### Search for anchors:
```bash
# Encontrar todos os anchor comments
grep -r "AIDEV-" src/

# Filtrar por tipo específico
grep -r "AIDEV-NOTE" src/
grep -r "AIDEV-TODO" src/
grep -r "AIDEV-QUESTION" src/
``` 