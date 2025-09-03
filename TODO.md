# Dice Roller - TODO & Feature Roadmap

This document outlines planned features and enhancements for the Dice Roller library, organized by priority and development phases.

## High Priority (Next Release)

### 1. Success Counting & Dice Pools 🎯
**Status**: ✅ COMPLETED  
**Effort**: Medium  
**Impact**: High - Essential for modern RPG systems

- [x] Implement `rollSuccessPool()` method
  - Count successes against threshold
  - Track botches (1s in World of Darkness style)
  - Support various success mechanics
- [x] Add target number systems for multiple dice
- [x] Support different success thresholds per die
- [x] Add dice pool modifiers (extra dice, penalties)
- [x] CLI support for success pools with options

**Example Systems**: World of Darkness, Shadowrun, Chronicles of Darkness

**Implementation Notes**: 
- Added three new methods: `rollSuccessPool()`, `rollTargetNumbers()`, `rollVariableSuccessPool()`
- Full CLI integration with `success` command and flags
- Comprehensive test suite with 18 test cases
- Fixed random function propagation in `rollDice()` method

### 2. Expression Parser Enhancements 📝
**Status**: In Progress  
**Effort**: High  
**Impact**: High - Greatly expands expression capabilities

- [x] Add parentheses support for complex expressions ✅
  - `(2d6+3)*2` ✅ 
  - `3d(1d4+2)` (parsing works, dynamic dice count not yet implemented)
- [x] Implement conditional operators ✅
  - `3d6>10` (count successes) ✅
  - `4d6>=4` (meets threshold) ✅
  - Also supports: `<`, `<=`, `=`, `==`
- [ ] Add reroll mechanics
  - `4d6r1` (reroll 1s)
  - `3d6ro<2` (reroll once if less than 2)
  - `2d8rr1` (reroll 1s repeatedly)

### 3. Advanced Dice Mechanics 🎲
**Status**: Not Started  
**Effort**: Medium  
**Impact**: High - Common gaming mechanics

- [ ] Penetrating dice (exploding minus 1)
- [ ] Compounding dice (add explosions to total)
- [ ] Extended keep/drop mechanics
  - Drop highest/lowest X dice
  - Keep middle X dice
  - Conditional keeps (above/below threshold)
- [ ] Step dice system (Savage Worlds style)

## Medium Priority (Future Releases)

### 4. Roll History & Session Management 📊
**Status**: Not Started  
**Effort**: Medium  
**Impact**: Medium - Great for applications and gaming sessions

- [ ] Create `DiceSession` class
- [ ] Implement roll history tracking
- [ ] Add undo/redo functionality
- [ ] Session statistics and summaries
- [ ] Export/import session data (JSON)
- [ ] Roll replay functionality

### 5. Enhanced Statistics & Analysis 📈
**Status**: Not Started  
**Effort**: Medium  
**Impact**: Medium - Valuable for game design and analysis

- [ ] Probability distribution calculations
- [ ] Percentile analysis (P25, P50, P75, P90, P95)
- [ ] Expression comparison tools
- [ ] Theoretical vs actual roll analysis
- [ ] Monte Carlo simulation improvements
- [ ] Statistical significance testing

### 6. Specialized Gaming Systems 🎮
**Status**: Not Started  
**Effort**: Medium  
**Impact**: Medium - Expands target audience

- [ ] FATE/Fudge dice implementation
- [ ] Genesys/FFG narrative dice
- [ ] Dice step systems
- [ ] Custom success/failure symbols
- [ ] Stress dice mechanics
- [ ] Initiative tracking helpers

## Lower Priority (Nice to Have)

### 7. Event System & Observers 🔔
**Status**: Not Started  
**Effort**: Medium  
**Impact**: Low-Medium - Enables rich integrations

- [ ] Implement event emitter pattern
- [ ] Add roll lifecycle events
  - `beforeRoll`, `afterRoll`
  - `criticalSuccess`, `criticalFailure`
  - `explosion`, `reroll`
- [ ] Custom event handlers
- [ ] Plugin system foundation

### 8. Performance & Optimization ⚡
**Status**: Not Started  
**Effort**: High  
**Impact**: Low-Medium - Important for high-volume usage

- [ ] Expression compilation and caching
- [ ] Batch rolling optimizations
- [ ] Memory pool for large dice operations
- [ ] Web Worker support for heavy calculations
- [ ] Streaming results for massive simulations

### 9. Import/Export & Persistence 💾
**Status**: Not Started  
**Effort**: Low  
**Impact**: Low - Quality of life improvement

- [ ] Save/load dice configurations
- [ ] Roll result serialization
- [ ] Custom die definitions export
- [ ] Session backup/restore
- [ ] Multiple save format support

### 10. Quality of Life Improvements 🛠️
**Status**: Not Started  
**Effort**: Low-Medium  
**Impact**: Low-Medium - Developer experience

- [ ] Dice aliases system
  - `roller.addAlias('initiative', '1d20+dex')`
- [ ] Macro definitions
  - `roller.defineMacro('attack', ['1d20+{bonus}', '1d8+{str}'])`
- [ ] Expression validation and suggestions
- [ ] Auto-completion hints
- [ ] Better error messages with suggestions

## Future Considerations

### 11. Web Integration Features 🌐
**Status**: Not Started  
**Effort**: High  
**Impact**: Low - Specific use case

- [ ] Dice animation data generation
- [ ] Shareable roll links/codes
- [ ] QR code generation for rolls
- [ ] Social media integration helpers
- [ ] Webhook support for external systems

### 12. Advanced Mathematical Features 🧮
**Status**: Not Started  
**Effort**: High  
**Impact**: Low - Specialized use cases

- [ ] Probability density functions
- [ ] Bayesian analysis tools
- [ ] Information theory metrics
- [ ] Game balance analysis tools
- [ ] Expected value optimizations
- [ ] Risk assessment calculations

## Technical Debt & Maintenance

### Code Quality
- [ ] Increase test coverage to 100%
- [ ] Add performance benchmarks
- [ ] Documentation improvements
- [ ] Type safety enhancements
- [ ] Code splitting for tree-shaking

### Infrastructure
- [ ] CI/CD pipeline improvements
- [ ] Automated security scanning
- [ ] Dependency updates automation
- [ ] Release automation
- [ ] Documentation site generation

## Version Planning

### v1.2.0 - Success & Pools
- Success counting systems
- Basic dice pools
- Simple reroll mechanics

### v1.3.0 - Advanced Expressions
- Parentheses support
- Conditional operators
- Extended reroll systems

### v1.4.0 - Gaming Systems
- Specialized dice systems
- Advanced mechanics
- Roll history

### v2.0.0 - Major Overhaul
- Event system
- Performance optimizations
- Breaking API changes (if needed)

---

## Notes

- **Effort Levels**: Low (1-2 days), Medium (3-7 days), High (1-3 weeks)
- **Impact Levels**: Based on user value and adoption potential
- **Breaking Changes**: Should be minimized until v2.0.0
- **Dependencies**: Some features depend on others (e.g., events need session management)

## Contributing

When implementing features from this TODO:

1. Create feature branch: `feature/success-pools`
2. Update tests and documentation
3. Ensure backward compatibility
4. Update CHANGELOG.md
5. Move completed items to CHANGELOG.md

---

*Last Updated: September 3, 2025*
*Next Review: October 1, 2025*
